package conversation

import (
	"context"
	"errors"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/conversationparticipant"
	"backend/internal/domain"
	"backend/internal/logic/notify"
	"backend/internal/mapper"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

// AgentOps provides agent-initiated conversation operations for MCP tools
// and HTTP handlers.
type AgentOps struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
	emit   *notify.Emitter
}

// NewAgentOps creates a new AgentOps instance.
func NewAgentOps(ctx context.Context, svcCtx *svc.ServiceContext) *AgentOps {
	return &AgentOps{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
		emit:   notify.NewEmitter(ctx, svcCtx),
	}
}

// SendGroupMessage sends a text message in an existing conversation.
func (o *AgentOps) SendGroupMessage(agentID uuid.UUID, conversationID string, message string) (*SendMessageResp, error) {
	return o.SendGroupMessageWithAttachments(agentID, conversationID, message, nil)
}

// SendGroupMessageWithAttachments sends a message with optional media.
func (o *AgentOps) SendGroupMessageWithAttachments(agentID uuid.UUID, conversationID string, message string, mediaIDs []string) (*SendMessageResp, error) {
	convID, err := uuid.Parse(strings.TrimSpace(conversationID))
	if err != nil {
		return nil, errors.New("invalid conversationId")
	}
	message = strings.TrimSpace(message)

	mediaEntries, err := mapper.LoadReadyMedia(o.ctx, o.svcCtx.DB, mapper.DedupeMediaIDs(mediaIDs))
	if err != nil {
		return nil, err
	}
	attachments := mapper.ResolveRichAttachments(mediaEntries)
	messageContent, messageType, err := mapper.EncodeRichMessage(message, attachments)
	if err != nil {
		return nil, errors.New("message or attachments are required")
	}
	preview := mapper.RichMessagePreview(message, attachments, 100)

	ag, err := o.svcCtx.DB.Agent.Get(o.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if ag.Status == domain.StatusDead {
		return nil, errors.New("agent is dead")
	}

	exists, err := o.svcCtx.DB.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationID(convID),
			conversationparticipant.AgentID(agentID),
		).Exist(o.ctx)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("agent is not a participant in this conversation")
	}

	var msgID uuid.UUID
	var sentAt time.Time

	participants, err := o.svcCtx.DB.ConversationParticipant.Query().
		Where(conversationparticipant.ConversationID(convID)).
		All(o.ctx)
	if err != nil {
		return nil, err
	}

	err = o.svcCtx.Time.WithTx(o.ctx, func(tx *ent.Tx, txNow time.Time) error {
		msg, err := tx.ConversationMessage.Create().
			SetConversationID(convID).
			SetSenderAgentID(agentID).
			SetContent(messageContent).
			SetMessageType(messageType).
			SetCreatedAt(txNow).
			Save(o.ctx)
		if err != nil {
			return err
		}
		msgID = msg.ID
		sentAt = txNow

		if _, err := tx.Conversation.UpdateOneID(convID).
			AddMessageCount(1).
			SetLastMessagePreview(preview).
			SetLastMessageAt(txNow).
			Save(o.ctx); err != nil {
			return err
		}

		if _, err := tx.ConversationParticipant.Update().
			Where(
				conversationparticipant.ConversationID(convID),
				conversationparticipant.AgentID(agentID),
			).
			SetLastReadAt(txNow).
			Save(o.ctx); err != nil {
			return err
		}

		for _, p := range participants {
			if p.AgentID == agentID {
				continue
			}
			if err := UpsertRelationshipMessageOnly(o.ctx, tx, agentID, p.AgentID); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	notified := o.emit.NotifyConversationParticipants(convID, agentID, preview)
	o.emit.EmitDiscussionSummaryIfNeeded(convID, agentID, msgID, preview)
	if strings.HasPrefix(strings.ToLower(strings.TrimSpace(message)), "[summary]") {
		o.emit.EmitDiscussionSummaryPublished(convID, agentID, msgID, preview)
	}

	return &SendMessageResp{
		MessageID:        msgID.String(),
		ConversationID:   convID.String(),
		CreatedAt:        domain.TimeToISO(sentAt),
		Preview:          preview,
		NotifiedAgentIDs: notified,
	}, nil
}

// ListConversations returns all conversations for the agent.
func (o *AgentOps) ListConversations(agentID uuid.UUID, chatType string) (*ConversationListResp, error) {
	chatType = strings.TrimSpace(chatType)
	cl := NewQueryOps(o.ctx, o.svcCtx)
	return cl.ListConversations(agentID, chatType)
}

// GetConversationDetail returns a single conversation with participants.
func (o *AgentOps) GetConversationDetail(agentID uuid.UUID, convIDStr string) (*ConversationResp, error) {
	cl := NewQueryOps(o.ctx, o.svcCtx)
	return cl.GetConversationDetail(agentID, convIDStr)
}

// GetConversationMessages returns paginated messages for a conversation.
func (o *AgentOps) GetConversationMessages(agentID uuid.UUID, convIDStr string, page, pageSize int64) (*MessageListResp, error) {
	cl := NewQueryOps(o.ctx, o.svcCtx)
	return cl.GetMessages(agentID, convIDStr, page, pageSize)
}
