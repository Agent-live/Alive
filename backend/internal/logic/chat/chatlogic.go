package chat

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/conversation"
	"backend/ent/conversationparticipant"
	"backend/internal/domain"
	"backend/internal/mapper"
	"backend/internal/port"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

// SendMessageInput carries everything the business logic needs to process a
// user chat message. All HTTP/WS-specific concerns (headers, connections) are
// resolved by the caller before constructing this struct.
type SendMessageInput struct {
	// UserID is the authenticated user.
	UserID uuid.UUID
	// Agent is the pre-resolved agent entity the user is chatting with.
	Agent *ent.Agent
	// UserText is the trimmed user message text.
	UserText string
	// Attachments are already-resolved rich attachments.
	Attachments []domain.RichMessageAttachment
}

// SendMessageResult is the outcome of processing a chat message.
type SendMessageResult struct {
	ConversationID string
	MessageID      string
	Reply          string
	CreatedAt      time.Time
}

type preparedChatRequest struct {
	conversationID uuid.UUID
	requestID      string
	runtimeAgentID string
	injectMessage  string
}

func persistAssistantReply(
	ctx context.Context,
	svcCtx *svc.ServiceContext,
	conversationID uuid.UUID,
	senderAgentID uuid.UUID,
	assistantText string,
) (time.Time, error) {
	var assistantCreatedAt time.Time
	err := svcCtx.Time.WithTx(ctx, func(tx *ent.Tx, txNow time.Time) error {
		assistantCreatedAt = txNow
		if _, createErr := tx.ConversationMessage.Create().
			SetConversationID(conversationID).
			SetSenderAgentID(senderAgentID).
			SetContent(assistantText).
			SetMessageType(domain.MessageTypeText).
			SetInteractionType("chat_assistant").
			SetCreatedAt(txNow).
			Save(ctx); createErr != nil {
			return createErr
		}

		preview := assistantText
		if len(preview) > 100 {
			preview = preview[:100]
		}
		if _, upErr := tx.Conversation.UpdateOneID(conversationID).
			AddMessageCount(1).
			SetLastMessagePreview(preview).
			SetLastMessageAt(txNow).
			Save(ctx); upErr != nil {
			return upErr
		}

		return nil
	})
	return assistantCreatedAt, err
}

// BuildChatPrompt produces a text prompt that includes non-image attachment
// references so the model is aware of them.
func BuildChatPrompt(text string, attachments []domain.RichMessageAttachment) string {
	parts := make([]string, 0, len(attachments)+1)
	if strings.TrimSpace(text) != "" {
		parts = append(parts, strings.TrimSpace(text))
	}
	parts = append(parts, "User attached the following files:")
	for idx, item := range attachments {
		label := mapper.AttachmentMessageType(item.MimeType)
		parts = append(parts, fmt.Sprintf("%d. [%s] %s", idx+1, label, item.URL))
	}
	return strings.Join(parts, "\n")
}

// FilterNonImageAttachments returns only the attachments that are NOT images.
func FilterNonImageAttachments(in []domain.RichMessageAttachment) []domain.RichMessageAttachment {
	if len(in) == 0 {
		return nil
	}
	out := make([]domain.RichMessageAttachment, 0, len(in))
	for _, item := range in {
		if strings.HasPrefix(strings.ToLower(strings.TrimSpace(item.MimeType)), "image/") {
			continue
		}
		out = append(out, item)
	}
	return out
}

func prepareChatRequest(ctx context.Context, svcCtx *svc.ServiceContext, in SendMessageInput) (*preparedChatRequest, error) {
	ag := in.Agent
	if ag == nil {
		return nil, errors.New("agent is required")
	}
	if ag.Status == domain.StatusDead {
		return nil, errors.New("agent is dead")
	}

	userContent, _, err := mapper.EncodeRichMessage(in.UserText, in.Attachments)
	if err != nil {
		return nil, errors.New("content or attachments are required")
	}

	var convID uuid.UUID
	err = svcCtx.Time.WithTx(ctx, func(tx *ent.Tx, txNow time.Time) error {
		conv, _, findErr := findOrCreateHumanBotChat(ctx, tx, ag.ID, txNow)
		if findErr != nil {
			return findErr
		}
		convID = conv.ID

		// Persist user message.
		if _, createErr := tx.ConversationMessage.Create().
			SetConversationID(conv.ID).
			SetSenderAgentID(ag.ID).
			SetContent(userContent).
			SetMessageType(domain.MessageTypeText).
			SetInteractionType("chat_user").
			SetCreatedAt(txNow).
			Save(ctx); createErr != nil {
			return createErr
		}

		// Update conversation metadata.
		preview := in.UserText
		if len(preview) > 100 {
			preview = preview[:100]
		}
		if _, upErr := tx.Conversation.UpdateOneID(conv.ID).
			AddMessageCount(1).
			SetLastMessagePreview(preview).
			SetLastMessageAt(txNow).
			Save(ctx); upErr != nil {
			return upErr
		}

		// Mark sender's read state.
		if _, upErr := tx.ConversationParticipant.Update().
			Where(
				conversationparticipant.ConversationID(conv.ID),
				conversationparticipant.AgentID(ag.ID),
			).
			SetLastReadAt(txNow).
			Save(ctx); upErr != nil {
			return upErr
		}

		return nil
	})
	if err != nil {
		logx.WithContext(ctx).Errorf("failed to persist user chat message: %v", err)
		return nil, fmt.Errorf("failed to save message: %w", err)
	}

	// Prepare the prompt: if there are non-image attachments the model
	// cannot see, describe them in the prompt text.
	promptText := in.UserText
	if nonImage := FilterNonImageAttachments(in.Attachments); len(nonImage) > 0 {
		promptText = BuildChatPrompt(in.UserText, nonImage)
	}

	aliveAgentRuntimeID := strings.TrimSpace(domain.PtrString(ag.AliveAgentRuntimeID))
	if aliveAgentRuntimeID == "" {
		aliveAgentRuntimeID = ag.ID.String()
	}

	injectMsg := strings.TrimSpace(promptText)
	if injectMsg == "" {
		injectMsg = "User sent attachments."
	}

	return &preparedChatRequest{
		conversationID: convID,
		requestID:      uuid.NewString(),
		runtimeAgentID: aliveAgentRuntimeID,
		injectMessage:  injectMsg,
	}, nil
}

// SendMessage is the core business logic for processing a single user-to-agent
// chat message. It persists the user message as a ConversationMessage,
// calls the AI model, persists the assistant reply, and returns the result.
func SendMessage(ctx context.Context, svcCtx *svc.ServiceContext, in SendMessageInput) (*SendMessageResult, error) {
	prepared, err := prepareChatRequest(ctx, svcCtx, in)
	if err != nil {
		return nil, err
	}

	broker := svcCtx.ChatBroker
	var replyCh <-chan port.ReplyMessage
	if broker != nil {
		replyCh = broker.RegisterPending(prepared.requestID, in.Agent.ID.String())
		defer broker.UnregisterPending(prepared.requestID)
	}

	// --- InjectRun via AgentRuntime ---
	_, injectErr := svcCtx.AgentRuntime.InjectRun(ctx, port.InjectRunRequest{
		AgentID:        prepared.runtimeAgentID,
		SessionKey:     prepared.conversationID.String(),
		RequestID:      prepared.requestID,
		Message:        prepared.injectMessage,
		TimeoutSeconds: domain.ChatInjectTimeout,
		Metadata: map[string]string{
			"userId":         in.UserID.String(),
			"conversationId": prepared.conversationID.String(),
			"requestId":      prepared.requestID,
			"channel":        "chat",
		},
	})

	var assistantText string
	if injectErr == nil && broker != nil {
		waitCtx, cancel := context.WithTimeout(ctx, domain.ChatReplyTimeout)
		defer cancel()
		select {
		case msg := <-replyCh:
			assistantText = msg.Reply
		case <-waitCtx.Done():
		}
	}
	if assistantText == "" {
		if injectErr != nil {
			logx.WithContext(ctx).Errorf("inject run failed: %v", injectErr)
		}
		assistantText = "I'm processing your message. Please wait a moment and try again."
	}

	assistantCreatedAt, err := persistAssistantReply(ctx, svcCtx, prepared.conversationID, in.Agent.ID, assistantText)
	if err != nil {
		logx.WithContext(ctx).Errorf("failed to persist assistant reply: %v", err)
	}

	return &SendMessageResult{
		ConversationID: prepared.conversationID.String(),
		MessageID:      prepared.requestID,
		Reply:          assistantText,
		CreatedAt:      assistantCreatedAt,
	}, nil
}

// StreamCallback is called for each incremental token chunk during streaming.
type StreamCallback func(token string, done bool)

// SendMessageStreaming is a streaming variant of SendMessage. It persists the
// user message, injects the run, and streams token chunks via the callback.
// The final full reply text is persisted and returned.
func SendMessageStreaming(ctx context.Context, svcCtx *svc.ServiceContext, in SendMessageInput, cb StreamCallback) (*SendMessageResult, error) {
	prepared, err := prepareChatRequest(ctx, svcCtx, in)
	if err != nil {
		return nil, err
	}

	broker := svcCtx.ChatBroker

	var streamCh <-chan port.StreamChunk
	var replyCh <-chan port.ReplyMessage
	if broker != nil {
		// Open stream channel BEFORE injecting run so chunks can be delivered.
		streamCh = broker.OpenStream(prepared.requestID, in.Agent.ID.String())
		// Also register for non-streaming fallback.
		replyCh = broker.RegisterPending(prepared.requestID, in.Agent.ID.String())
		defer func() {
			broker.UnregisterPending(prepared.requestID)
			broker.CloseStream(prepared.requestID)
		}()
	}

	_, injectErr := svcCtx.AgentRuntime.InjectRun(ctx, port.InjectRunRequest{
		AgentID:        prepared.runtimeAgentID,
		SessionKey:     prepared.conversationID.String(),
		RequestID:      prepared.requestID,
		Message:        prepared.injectMessage,
		TimeoutSeconds: domain.ChatInjectTimeout,
		Metadata: map[string]string{
			"userId":         in.UserID.String(),
			"conversationId": prepared.conversationID.String(),
			"requestId":      prepared.requestID,
			"channel":        "chat",
		},
	})

	var assistantText string
	if injectErr == nil && broker != nil {
		ctx2, cancel := context.WithTimeout(ctx, domain.ChatReplyTimeout)
		defer cancel()

		// Read from both stream and reply channels.
		var buf []byte
		streamed := false
	loop:
		for {
			select {
			case chunk, ok := <-streamCh:
				if !ok {
					break loop
				}
				streamed = true
				buf = append(buf, chunk.Token...)
				if cb != nil {
					cb(chunk.Token, chunk.Done)
				}
				if chunk.Done {
					break loop
				}
			case msg := <-replyCh:
				// Non-streaming fallback: agent used reply_to_chat instead.
				if !streamed {
					assistantText = msg.Reply
					if cb != nil {
						cb(msg.Reply, true)
					}
				}
				break loop
			case <-ctx2.Done():
				break loop
			}
		}
		if streamed && assistantText == "" {
			assistantText = string(buf)
		}
	}
	if assistantText == "" {
		if injectErr != nil {
			logx.WithContext(ctx).Errorf("inject run failed: %v", injectErr)
		}
		assistantText = "I'm processing your message. Please wait a moment and try again."
		if cb != nil {
			cb(assistantText, true)
		}
	}

	assistantCreatedAt, err := persistAssistantReply(ctx, svcCtx, prepared.conversationID, in.Agent.ID, assistantText)
	if err != nil {
		logx.WithContext(ctx).Errorf("failed to persist assistant reply: %v", err)
	}

	return &SendMessageResult{
		ConversationID: prepared.conversationID.String(),
		MessageID:      prepared.requestID,
		Reply:          assistantText,
		CreatedAt:      assistantCreatedAt,
	}, nil
}

// findOrCreateHumanBotChat finds an existing human-bot direct conversation for
// the given agent, or creates one. Must be called inside a TimeEngine transaction.
func findOrCreateHumanBotChat(ctx context.Context, tx *ent.Tx, agentID uuid.UUID, now time.Time) (*ent.Conversation, bool, error) {
	// Find a human-bot direct conversation where this agent is a participant.
	convs, err := tx.Conversation.Query().
		Where(
			conversation.Type(domain.ConversationTypeDirect),
			conversation.ChatType(domain.ChatTypeHumanBot),
			conversation.Status(domain.ConversationStatusActive),
			conversation.HasParticipantsWith(conversationparticipant.AgentID(agentID)),
		).All(ctx)
	if err != nil {
		return nil, false, err
	}

	// Return the first matching conversation.
	for _, c := range convs {
		return c, false, nil
	}

	// Create new direct conversation.
	conv, err := tx.Conversation.Create().
		SetType(domain.ConversationTypeDirect).
		SetChatType(domain.ChatTypeHumanBot).
		SetCreatorAgentID(agentID).
		SetParticipantCount(1).
		SetStatus(domain.ConversationStatusActive).
		Save(ctx)
	if err != nil {
		return nil, false, err
	}

	if _, err := tx.ConversationParticipant.Create().
		SetConversationID(conv.ID).
		SetAgentID(agentID).
		SetRole(domain.ParticipantRoleCreator).
		SetJoinedAt(now).
		Save(ctx); err != nil {
		return nil, false, err
	}

	return conv, true, nil
}
