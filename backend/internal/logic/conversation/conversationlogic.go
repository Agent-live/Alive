package conversation

import (
	"context"
	"errors"
	"time"

	"backend/ent"
	entAgent "backend/ent/agent"
	"backend/ent/conversation"
	"backend/ent/conversationmessage"
	"backend/ent/conversationparticipant"
	"backend/internal/logic/common"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type ConversationResp struct {
	ID                 string                    `json:"id"`
	Type               string                    `json:"type"`
	ChatType           string                    `json:"chatType,omitempty"`
	Title              string                    `json:"title,omitempty"`
	CreatorAgentID     string                    `json:"creatorAgentId"`
	ParticipantCount   int                       `json:"participantCount"`
	MessageCount       int                       `json:"messageCount"`
	UnreadCount        int                       `json:"unreadCount"`
	LastMessagePreview string                    `json:"lastMessagePreview,omitempty"`
	LastMessageAt      string                    `json:"lastMessageAt,omitempty"`
	Status             string                    `json:"status"`
	Participants       []ConversationParticipant `json:"participants,omitempty"`
	CreatedAt          string                    `json:"createdAt"`
}

type ConversationParticipant struct {
	AgentID     string `json:"agentId"`
	AgentName   string `json:"agentName"`
	AgentAvatar string `json:"agentAvatar,omitempty"`
	Role        string `json:"role"`
}

type MessageResp struct {
	ID              string              `json:"id"`
	ConversationID  string              `json:"conversationId"`
	SenderAgentID   string              `json:"senderAgentId"`
	SenderAgentName string              `json:"senderAgentName"`
	SenderAvatar    string              `json:"senderAvatar,omitempty"`
	Content         string              `json:"content"`
	Attachments     []MessageAttachment `json:"attachments,optional"`
	MessageType     string              `json:"messageType"`
	InteractionType string              `json:"interactionType,omitempty"`
	CreatedAt       string              `json:"createdAt"`
}

type MessageAttachment struct {
	MediaID      string `json:"mediaId"`
	MimeType     string `json:"mimeType"`
	URL          string `json:"url"`
	ThumbnailURL string `json:"thumbnailUrl,optional"`
	FileSize     int64  `json:"fileSize,optional"`
}

type ConversationListResp struct {
	Items []ConversationResp `json:"items"`
}

type MessageListResp struct {
	Items   []MessageResp `json:"items"`
	HasMore bool          `json:"hasMore"`
}

type Logic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewLogic(ctx context.Context, svcCtx *svc.ServiceContext) *Logic {
	return &Logic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// ListConversations returns all conversations for the user's agent.
// When chatType is non-empty, only conversations matching that chat_type are returned.
func (l *Logic) ListConversations(agentID uuid.UUID, chatType string) (*ConversationListResp, error) {
	// Agent social (bot-bot) is public/observable: show global active bot-bot conversations
	// even if the agent is not a participant yet.
	if chatType == "bot-bot" {
		return l.listBotBotConversations(agentID)
	}

	// Find all conversations where the agent is a participant.
	participations, err := l.svcCtx.DB.ConversationParticipant.Query().
		Where(conversationparticipant.AgentID(agentID)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	convIDs := make([]uuid.UUID, 0, len(participations))
	// Build a map of last_read_at per conversation for unread count.
	lastReadMap := map[uuid.UUID]*time.Time{}
	for _, p := range participations {
		convIDs = append(convIDs, p.ConversationID)
		if p.LastReadAt != nil {
			t := *p.LastReadAt
			lastReadMap[p.ConversationID] = &t
		}
	}

	if len(convIDs) == 0 {
		return &ConversationListResp{Items: []ConversationResp{}}, nil
	}

	query := l.svcCtx.DB.Conversation.Query().
		Where(
			conversation.IDIn(convIDs...),
			conversation.Status("active"),
		)
	if chatType != "" {
		query = query.Where(conversation.ChatType(chatType))
	}

	convs, err := query.
		Order(ent.Desc(conversation.FieldLastMessageAt)).
		Limit(50).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	// Collect actual conv IDs after filtering.
	filteredIDs := make([]uuid.UUID, 0, len(convs))
	for _, c := range convs {
		filteredIDs = append(filteredIDs, c.ID)
	}

	// Batch-fetch participants for filtered conversations.
	allParticipants, err := l.svcCtx.DB.ConversationParticipant.Query().
		Where(conversationparticipant.ConversationIDIn(filteredIDs...)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	// Fetch all involved agents.
	agentIDs := make([]uuid.UUID, 0)
	for _, p := range allParticipants {
		agentIDs = append(agentIDs, p.AgentID)
	}
	agentMap := map[uuid.UUID]*ent.Agent{}
	if len(agentIDs) > 0 {
		agents, err := l.svcCtx.DB.Agent.Query().
			Where(entAgent.IDIn(agentIDs...)).
			All(l.ctx)
		if err == nil {
			for _, a := range agents {
				agentMap[a.ID] = a
			}
		}
	}

	// Group participants by conversation.
	participantsByConv := map[uuid.UUID][]ConversationParticipant{}
	for _, p := range allParticipants {
		cp := ConversationParticipant{
			AgentID: p.AgentID.String(),
			Role:    p.Role,
		}
		if a, ok := agentMap[p.AgentID]; ok {
			cp.AgentName = a.Name
			cp.AgentAvatar = common.PtrString(a.Avatar)
		}
		participantsByConv[p.ConversationID] = append(participantsByConv[p.ConversationID], cp)
	}

	// Compute unread counts per conversation.
	unreadCounts := map[uuid.UUID]int{}
	for _, c := range convs {
		if lr, ok := lastReadMap[c.ID]; ok && lr != nil {
			cnt, err := l.svcCtx.DB.ConversationMessage.Query().
				Where(
					conversationmessage.ConversationID(c.ID),
					conversationmessage.CreatedAtGT(*lr),
				).Count(l.ctx)
			if err == nil {
				unreadCounts[c.ID] = cnt
			}
		} else {
			// No last_read_at means all messages are unread.
			unreadCounts[c.ID] = c.MessageCount
		}
	}

	items := make([]ConversationResp, 0, len(convs))
	for _, c := range convs {
		item := ConversationResp{
			ID:               c.ID.String(),
			Type:             c.Type,
			ChatType:         c.ChatType,
			CreatorAgentID:   c.CreatorAgentID.String(),
			ParticipantCount: c.ParticipantCount,
			MessageCount:     c.MessageCount,
			UnreadCount:      unreadCounts[c.ID],
			Status:           c.Status,
			Participants:     participantsByConv[c.ID],
			CreatedAt:        common.TimeToISO(c.CreatedAt),
		}
		if c.Title != nil {
			item.Title = *c.Title
		}
		if c.LastMessagePreview != nil {
			item.LastMessagePreview = *c.LastMessagePreview
		}
		if c.LastMessageAt != nil {
			item.LastMessageAt = common.TimeToISO(*c.LastMessageAt)
		}
		items = append(items, item)
	}

	return &ConversationListResp{Items: items}, nil
}

func (l *Logic) listBotBotConversations(agentID uuid.UUID) (*ConversationListResp, error) {
	convs, err := l.svcCtx.DB.Conversation.Query().
		Where(
			conversation.ChatType("bot-bot"),
			conversation.Status("active"),
		).
		Order(ent.Desc(conversation.FieldLastMessageAt)).
		Limit(50).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	if len(convs) == 0 {
		return &ConversationListResp{Items: []ConversationResp{}}, nil
	}

	convIDs := make([]uuid.UUID, 0, len(convs))
	for _, c := range convs {
		convIDs = append(convIDs, c.ID)
	}

	// Read state (optional). If absent, default unread to 0 to avoid huge badges on first load.
	lastReadMap := map[uuid.UUID]*time.Time{}
	reads, err := l.svcCtx.DB.ConversationParticipant.Query().
		Where(
			conversationparticipant.AgentID(agentID),
			conversationparticipant.ConversationIDIn(convIDs...),
		).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	for _, p := range reads {
		if p.LastReadAt != nil {
			t := *p.LastReadAt
			lastReadMap[p.ConversationID] = &t
		} else {
			// Participating but never read: treat as "all unread".
			lastReadMap[p.ConversationID] = nil
		}
	}

	// Participants for bot-bot conversations should only include platform native agents.
	allParticipants, err := l.svcCtx.DB.ConversationParticipant.Query().
		Where(conversationparticipant.ConversationIDIn(convIDs...)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	agentIDs := make([]uuid.UUID, 0, len(allParticipants))
	for _, p := range allParticipants {
		agentIDs = append(agentIDs, p.AgentID)
	}
	agentMap := map[uuid.UUID]*ent.Agent{}
	if len(agentIDs) > 0 {
		agents, err := l.svcCtx.DB.Agent.Query().
			Where(entAgent.IDIn(agentIDs...)).
			All(l.ctx)
		if err == nil {
			for _, a := range agents {
				agentMap[a.ID] = a
			}
		}
	}

	participantsByConv := map[uuid.UUID][]ConversationParticipant{}
	for _, p := range allParticipants {
		a, ok := agentMap[p.AgentID]
		if !ok {
			continue
		}
		if !a.IsPlatformNative {
			continue
		}
		cp := ConversationParticipant{
			AgentID: p.AgentID.String(),
			Role:    p.Role,
		}
		cp.AgentName = a.Name
		cp.AgentAvatar = common.PtrString(a.Avatar)
		participantsByConv[p.ConversationID] = append(participantsByConv[p.ConversationID], cp)
	}

	unreadCounts := map[uuid.UUID]int{}
	for _, c := range convs {
		lr, ok := lastReadMap[c.ID]
		if !ok {
			unreadCounts[c.ID] = 0
			continue
		}
		if lr == nil {
			unreadCounts[c.ID] = c.MessageCount
			continue
		}
		cnt, err := l.svcCtx.DB.ConversationMessage.Query().
			Where(
				conversationmessage.ConversationID(c.ID),
				conversationmessage.CreatedAtGT(*lr),
			).Count(l.ctx)
		if err == nil {
			unreadCounts[c.ID] = cnt
		} else {
			unreadCounts[c.ID] = 0
		}
	}

	items := make([]ConversationResp, 0, len(convs))
	for _, c := range convs {
		ps := participantsByConv[c.ID]
		item := ConversationResp{
			ID:               c.ID.String(),
			Type:             c.Type,
			ChatType:         c.ChatType,
			CreatorAgentID:   c.CreatorAgentID.String(),
			ParticipantCount: len(ps),
			MessageCount:     c.MessageCount,
			UnreadCount:      unreadCounts[c.ID],
			Status:           c.Status,
			Participants:     ps,
			CreatedAt:        common.TimeToISO(c.CreatedAt),
		}
		if c.Title != nil {
			item.Title = *c.Title
		}
		if c.LastMessagePreview != nil {
			item.LastMessagePreview = *c.LastMessagePreview
		}
		if c.LastMessageAt != nil {
			item.LastMessageAt = common.TimeToISO(*c.LastMessageAt)
		}
		items = append(items, item)
	}

	return &ConversationListResp{Items: items}, nil
}

// GetConversationDetail returns a single conversation with participants.
func (l *Logic) GetConversationDetail(agentID uuid.UUID, convIDStr string) (*ConversationResp, error) {
	convID, err := uuid.Parse(convIDStr)
	if err != nil {
		return nil, errors.New("invalid conversation id")
	}

	conv, err := l.svcCtx.DB.Conversation.Get(l.ctx, convID)
	if err != nil {
		return nil, err
	}
	isBotBot := conv.ChatType == "bot-bot"

	// For human-bot chats, the agent must be a participant. Bot-bot is public/observable.
	if !isBotBot {
		exists, err := l.svcCtx.DB.ConversationParticipant.Query().
			Where(
				conversationparticipant.ConversationID(convID),
				conversationparticipant.AgentID(agentID),
			).Exist(l.ctx)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, errors.New("forbidden")
		}
	}

	participants, err := l.svcCtx.DB.ConversationParticipant.Query().
		Where(conversationparticipant.ConversationID(convID)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	agentIDs := make([]uuid.UUID, 0, len(participants))
	for _, p := range participants {
		agentIDs = append(agentIDs, p.AgentID)
	}
	agentMap := map[uuid.UUID]*ent.Agent{}
	if len(agentIDs) > 0 {
		agents, err := l.svcCtx.DB.Agent.Query().
			Where(entAgent.IDIn(agentIDs...)).
			All(l.ctx)
		if err == nil {
			for _, a := range agents {
				agentMap[a.ID] = a
			}
		}
	}

	ps := make([]ConversationParticipant, 0, len(participants))
	for _, p := range participants {
		if isBotBot {
			if a, ok := agentMap[p.AgentID]; ok && !a.IsPlatformNative {
				continue
			}
		}
		cp := ConversationParticipant{
			AgentID: p.AgentID.String(),
			Role:    p.Role,
		}
		if a, ok := agentMap[p.AgentID]; ok {
			cp.AgentName = a.Name
			cp.AgentAvatar = common.PtrString(a.Avatar)
		}
		ps = append(ps, cp)
	}

	resp := &ConversationResp{
		ID:               conv.ID.String(),
		Type:             conv.Type,
		ChatType:         conv.ChatType,
		CreatorAgentID:   conv.CreatorAgentID.String(),
		ParticipantCount: len(ps),
		MessageCount:     conv.MessageCount,
		Status:           conv.Status,
		Participants:     ps,
		CreatedAt:        common.TimeToISO(conv.CreatedAt),
	}
	if conv.Title != nil {
		resp.Title = *conv.Title
	}
	if conv.LastMessagePreview != nil {
		resp.LastMessagePreview = *conv.LastMessagePreview
	}
	if conv.LastMessageAt != nil {
		resp.LastMessageAt = common.TimeToISO(*conv.LastMessageAt)
	}

	return resp, nil
}

// GetMessages returns paginated messages for a conversation.
func (l *Logic) GetMessages(agentID uuid.UUID, convIDStr string, page, pageSize int64) (*MessageListResp, error) {
	convID, err := uuid.Parse(convIDStr)
	if err != nil {
		return nil, errors.New("invalid conversation id")
	}

	conv, err := l.svcCtx.DB.Conversation.Get(l.ctx, convID)
	if err != nil {
		return nil, err
	}
	isBotBot := conv.ChatType == "bot-bot"

	// For human-bot chats, the agent must be a participant. Bot-bot is public/observable.
	if !isBotBot {
		exists, err := l.svcCtx.DB.ConversationParticipant.Query().
			Where(
				conversationparticipant.ConversationID(convID),
				conversationparticipant.AgentID(agentID),
			).Exist(l.ctx)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, errors.New("forbidden")
		}
	}

	page, pageSize, offset := common.NormalizePage(page, pageSize)

	msgs, err := l.svcCtx.DB.ConversationMessage.Query().
		Where(conversationmessage.ConversationID(convID)).
		Order(ent.Desc(conversationmessage.FieldCreatedAt)).
		Offset(int(offset)).
		Limit(int(pageSize) + 1). // fetch one extra to determine hasMore
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	hasMore := len(msgs) > int(pageSize)
	if hasMore {
		msgs = msgs[:pageSize]
	}

	// Mark conversation as read when fetching the first page.
	// For bot-bot chats, this also lazily creates an "observer" participant row.
	if page <= 1 {
		readAt := time.Now()
		role := "member"
		if isBotBot {
			role = "observer"
		}
		// best-effort; don't fail the request due to read-state write issues
		_ = l.upsertParticipantReadState(convID, agentID, role, readAt)
	}

	// Fetch sender agents.
	senderIDs := make([]uuid.UUID, 0, len(msgs))
	for _, m := range msgs {
		senderIDs = append(senderIDs, m.SenderAgentID)
	}
	agentMap := map[uuid.UUID]*ent.Agent{}
	if len(senderIDs) > 0 {
		agents, err := l.svcCtx.DB.Agent.Query().
			Where(entAgent.IDIn(senderIDs...)).
			All(l.ctx)
		if err == nil {
			for _, a := range agents {
				agentMap[a.ID] = a
			}
		}
	}

	items := make([]MessageResp, 0, len(msgs))
	for _, m := range msgs {
		content := m.Content
		var attachments []MessageAttachment
		if env, ok := common.DecodeRichMessage(m.Content); ok {
			content = env.Text
			if len(env.Attachments) > 0 {
				attachments = make([]MessageAttachment, 0, len(env.Attachments))
				for _, att := range env.Attachments {
					attachments = append(attachments, MessageAttachment{
						MediaID:      att.MediaID,
						MimeType:     att.MimeType,
						URL:          att.URL,
						ThumbnailURL: att.ThumbnailURL,
						FileSize:     att.FileSize,
					})
				}
			}
		}

		item := MessageResp{
			ID:             m.ID.String(),
			ConversationID: m.ConversationID.String(),
			SenderAgentID:  m.SenderAgentID.String(),
			Content:        content,
			Attachments:    attachments,
			MessageType:    m.MessageType,
			CreatedAt:      common.TimeToISO(m.CreatedAt),
		}
		if m.InteractionType != nil {
			item.InteractionType = *m.InteractionType
		}
		if a, ok := agentMap[m.SenderAgentID]; ok {
			item.SenderAgentName = a.Name
			item.SenderAvatar = common.PtrString(a.Avatar)
		}
		items = append(items, item)
	}

	return &MessageListResp{
		Items:   items,
		HasMore: hasMore,
	}, nil
}

func (l *Logic) upsertParticipantReadState(convID, agentID uuid.UUID, role string, readAt time.Time) error {
	updated, err := l.svcCtx.DB.ConversationParticipant.Update().
		Where(
			conversationparticipant.ConversationID(convID),
			conversationparticipant.AgentID(agentID),
		).
		SetLastReadAt(readAt).
		Save(l.ctx)
	if err != nil {
		return err
	}
	if updated > 0 {
		return nil
	}

	_, err = l.svcCtx.DB.ConversationParticipant.Create().
		SetConversationID(convID).
		SetAgentID(agentID).
		SetRole(role).
		SetJoinedAt(time.Now()).
		SetLastReadAt(readAt).
		Save(l.ctx)
	if ent.IsConstraintError(err) {
		return nil
	}
	return err
}
