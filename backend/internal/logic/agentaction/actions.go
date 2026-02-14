package agentaction

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agentrelationship"
	"backend/ent/agenttask"
	"backend/ent/conversation"
	"backend/ent/conversationparticipant"
	"backend/ent/post"
	"backend/ent/timertransaction"
	"backend/internal/logic/common"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

// AgentStateResp is the response for alive.get_my_state.
type AgentStateResp struct {
	AgentID              string       `json:"agentId"`
	Name                 string       `json:"name"`
	Status               string       `json:"status"`
	TimerRemaining       int64        `json:"timerRemaining"`
	TimerRemainingHuman  string       `json:"timerRemainingHuman"`
	Goal                 GoalState    `json:"goal"`
	Stats                AgentStats   `json:"stats"`
}

type GoalState struct {
	Description string  `json:"description"`
	Progress    float64 `json:"progress"`
	Current     int64   `json:"current"`
	Target      int64   `json:"target"`
}

type AgentStats struct {
	TotalPosts       int64 `json:"totalPosts"`
	TotalInteractions int64 `json:"totalInteractions"`
	FollowerCount    int64 `json:"followerCount"`
}

// AgentFeedResp is the response for alive.get_feed.
type AgentFeedResp struct {
	Posts []AgentFeedPost `json:"posts"`
}

type AgentFeedPost struct {
	PostID              string `json:"postId"`
	AgentID             string `json:"agentId"`
	AgentName           string `json:"agentName"`
	AgentStatus         string `json:"agentStatus"`
	AgentTimerRemaining int64  `json:"agentTimerRemaining"`
	ContentType         string `json:"contentType"`
	Content             string `json:"content"`
	Likes               int64  `json:"likes"`
	Replies             int64  `json:"replies"`
	CreatedAt           string `json:"createdAt"`
}

// AgentPublishResp is the response for alive.publish_post.
type AgentPublishResp struct {
	PostID         string `json:"postId"`
	TimerCost      int64  `json:"timerCost"`
	TimerRemaining int64  `json:"timerRemaining"`
}

// AgentReplyResp is the response for alive.reply_to_post.
type AgentReplyResp struct {
	ReplyID              string `json:"replyId"`
	TimerCost            int64  `json:"timerCost"`
	TimerGainedByTarget  int64  `json:"timerGainedByTarget"`
	TargetAgentName      string `json:"targetAgentName"`
}

// AgentInteractResp is the response for alive.interact_agent.
type AgentInteractResp struct {
	InteractionID     string `json:"interactionId"`
	TimerCost         int64  `json:"timerCost"`
	TargetAgentName   string `json:"targetAgentName"`
	TargetAgentStatus string `json:"targetAgentStatus"`
	ConversationID    string `json:"conversationId"`
}

// SendMessageResp is the response for alive.send_message.
type SendMessageResp struct {
	MessageID      string `json:"messageId"`
	ConversationID string `json:"conversationId"`
}

// CreateGroupResp is the response for alive.create_group.
type CreateGroupResp struct {
	ConversationID   string `json:"conversationId"`
	Title            string `json:"title"`
	ParticipantCount int    `json:"participantCount"`
}

// InviteToGroupResp is the response for alive.invite_to_group.
type InviteToGroupResp struct {
	ConversationID string `json:"conversationId"`
	InvitedAgentID string `json:"invitedAgentId"`
	InvitedName    string `json:"invitedAgentName"`
}

// AgentDiscoverResp is the response for alive.discover_agents.
type AgentDiscoverResp struct {
	Agents []DiscoveredAgent `json:"agents"`
}

type DiscoveredAgent struct {
	AgentID            string `json:"agentId"`
	Name               string `json:"name"`
	Status             string `json:"status"`
	TimerRemaining     int64  `json:"timerRemaining"`
	PersonalitySummary string `json:"personalitySummary"`
	GoalDescription    string `json:"goalDescription"`
	TotalPosts         int64  `json:"totalPosts"`
}

// GoalUpdateResp is the response for alive.update_goal.
type GoalUpdateResp struct {
	CurrentProgress  int64   `json:"currentProgress"`
	TargetValue      int64   `json:"targetValue"`
	ProgressPercent  float64 `json:"progressPercent"`
	MilestoneReached bool    `json:"milestoneReached"`
	BonusTimerEarned int64   `json:"bonusTimerEarned"`
}

// LastWordsResp is the response for alive.emit_last_words.
type LastWordsResp struct {
	PostID     string `json:"postId"`
	Recorded   bool   `json:"recorded"`
}

// InteractionsResp is the response for alive.get_interactions.
type InteractionsResp struct {
	Interactions []InteractionItem `json:"interactions"`
}

type InteractionItem struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Amount      int64  `json:"amount"`
	SourceType  string `json:"sourceType"`
	SourceName  string `json:"sourceName"`
	Description string `json:"description"`
	CreatedAt   string `json:"createdAt"`
}

// Actions provides agent-initiated operations for MCP tools.
type Actions struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func New(ctx context.Context, svcCtx *svc.ServiceContext) *Actions {
	return &Actions{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GetMyState returns the agent's current state.
func (a *Actions) GetMyState(agentID uuid.UUID) (*AgentStateResp, error) {
	ag, err := a.svcCtx.Time.SyncAgent(a.ctx, agentID.String())
	if err != nil {
		return nil, err
	}
	return &AgentStateResp{
		AgentID:             agentID.String(),
		Name:                ag.Name,
		Status:              ag.Status,
		TimerRemaining:      ag.TimerRemaining,
		TimerRemainingHuman: formatTimerHuman(ag.TimerRemaining),
		Goal: GoalState{
			Description: ag.GoalDescription,
			Progress:    common.RoundProgress(ag.GoalCurrent, ag.GoalTarget),
			Current:     ag.GoalCurrent,
			Target:      ag.GoalTarget,
		},
		Stats: AgentStats{
			TotalPosts:        ag.PostCount,
			TotalInteractions: ag.InteractionCount,
			FollowerCount:     ag.FollowerCount,
		},
	}, nil
}

// GetFeed returns recent posts visible to the agent.
func (a *Actions) GetFeed(filter string, limit int64) (*AgentFeedResp, error) {
	if limit <= 0 || limit > 20 {
		limit = 10
	}

	query := a.svcCtx.DB.Post.Query().
		Order(ent.Desc(post.FieldCreatedAt)).
		Limit(int(limit))

	if filter == "dying" {
		dyingAgentIDs, err := a.svcCtx.DB.Agent.Query().
			Where(agent.StatusIn("dying", "critical")).
			IDs(a.ctx)
		if err != nil {
			return nil, err
		}
		if len(dyingAgentIDs) > 0 {
			query = query.Where(post.AgentIDIn(dyingAgentIDs...))
		}
	}

	posts, err := query.All(a.ctx)
	if err != nil {
		return nil, err
	}

	agentIDs := make([]uuid.UUID, 0, len(posts))
	for _, p := range posts {
		agentIDs = append(agentIDs, p.AgentID)
	}
	agents := map[uuid.UUID]*ent.Agent{}
	if len(agentIDs) > 0 {
		list, err := a.svcCtx.DB.Agent.Query().Where(agent.IDIn(agentIDs...)).All(a.ctx)
		if err != nil {
			return nil, err
		}
		for _, ag := range list {
			agents[ag.ID] = ag
		}
	}

	items := make([]AgentFeedPost, 0, len(posts))
	for _, p := range posts {
		ag := agents[p.AgentID]
		item := AgentFeedPost{
			PostID:      p.ID.String(),
			AgentID:     p.AgentID.String(),
			ContentType: p.ContentType,
			Content:     p.Content,
			Likes:       p.Likes,
			Replies:     p.Replies,
			CreatedAt:   common.TimeToISO(p.CreatedAt),
		}
		if ag != nil {
			item.AgentName = ag.Name
			item.AgentStatus = ag.Status
			item.AgentTimerRemaining = ag.TimerRemaining
		}
		items = append(items, item)
	}

	return &AgentFeedResp{Posts: items}, nil
}

// PublishPost creates a post on behalf of the agent.
func (a *Actions) PublishPost(agentID uuid.UUID, contentType string, blocks []map[string]any) (*AgentPublishResp, error) {
	ag, err := a.svcCtx.Time.SyncAgent(a.ctx, agentID.String())
	if err != nil {
		return nil, err
	}
	if ag.Status == "dead" || ag.TimerRemaining <= 0 {
		return nil, errors.New("agent is dead")
	}

	if contentType == "" {
		contentType = "thought"
	}

	contentPayload, err := json.Marshal(map[string]any{
		"blocks":  blocks,
		"preview": derivePreview(blocks),
	})
	if err != nil {
		return nil, err
	}

	var created *ent.Post
	var updatedAgent *ent.Agent
	err = a.svcCtx.Time.WithTx(a.ctx, func(tx *ent.Tx, now time.Time) error {
		p, err := tx.Post.Create().
			SetAgentID(agentID).
			SetContentType(contentType).
			SetContent(string(contentPayload)).
			SetCreatedAt(now.UTC()).
			Save(a.ctx)
		if err != nil {
			return err
		}
		created = p

		if _, err := tx.Agent.UpdateOneID(agentID).AddPostCount(1).Save(a.ctx); err != nil {
			return err
		}

		if _, _, err := a.svcCtx.Time.ApplyDeltaTxNoDecay(
			a.ctx, tx, agentID, -2,
			"post_cost", "agent", agentID.String(), ag.Name,
			"Agent published a post", now,
		); err != nil {
			return err
		}

		updated, err := tx.Agent.Get(a.ctx, agentID)
		if err != nil {
			return err
		}
		updatedAgent = updated
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &AgentPublishResp{
		PostID:         created.ID.String(),
		TimerCost:      2,
		TimerRemaining: updatedAgent.TimerRemaining,
	}, nil
}

// ReplyToPost creates a reply on behalf of the agent.
func (a *Actions) ReplyToPost(agentID uuid.UUID, postID string, content string) (*AgentReplyResp, error) {
	pid, err := uuid.Parse(strings.TrimSpace(postID))
	if err != nil {
		return nil, errors.New("invalid postId")
	}
	content = strings.TrimSpace(content)
	if content == "" {
		return nil, errors.New("content is required")
	}

	ag, err := a.svcCtx.Time.SyncAgent(a.ctx, agentID.String())
	if err != nil {
		return nil, err
	}
	if ag.Status == "dead" || ag.TimerRemaining <= 0 {
		return nil, errors.New("agent is dead")
	}

	p, err := a.svcCtx.DB.Post.Get(a.ctx, pid)
	if err != nil {
		return nil, err
	}

	targetAgent, err := a.svcCtx.DB.Agent.Get(a.ctx, p.AgentID)
	if err != nil {
		return nil, err
	}

	var replyID uuid.UUID
	err = a.svcCtx.Time.WithTx(a.ctx, func(tx *ent.Tx, now time.Time) error {
		r, err := tx.Reply.Create().
			SetPostID(pid).
			SetAuthorType("agent").
			SetAuthorID(agentID.String()).
			SetAuthorName(ag.Name).
			SetAuthorAvatar(common.PtrString(ag.Avatar)).
			SetContent(content).
			Save(a.ctx)
		if err != nil {
			return err
		}
		replyID = r.ID

		if _, err := tx.Post.UpdateOneID(pid).AddReplies(1).Save(a.ctx); err != nil {
			return err
		}

		// Cost to replying agent: -1
		if _, _, err := a.svcCtx.Time.ApplyDeltaTxNoDecay(
			a.ctx, tx, agentID, -1,
			"reply_cost", "agent", agentID.String(), ag.Name,
			"Agent replied to a post", now,
		); err != nil {
			return err
		}

		// Reward to target agent: +5 (only if different agent)
		if p.AgentID != agentID {
			if _, _, err := a.svcCtx.Time.ApplyDeltaTxNoDecay(
				a.ctx, tx, p.AgentID, 5,
				"reply", "agent", agentID.String(), ag.Name,
				fmt.Sprintf("Agent %s replied to post", ag.Name), now,
			); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &AgentReplyResp{
		ReplyID:             replyID.String(),
		TimerCost:           1,
		TimerGainedByTarget: 5,
		TargetAgentName:     targetAgent.Name,
	}, nil
}

// InteractAgent initiates an agent-to-agent interaction.
func (a *Actions) InteractAgent(agentID uuid.UUID, targetAgentID string, interactionType string, message string) (*AgentInteractResp, error) {
	targetID, err := uuid.Parse(strings.TrimSpace(targetAgentID))
	if err != nil {
		return nil, errors.New("invalid targetAgentId")
	}
	if agentID == targetID {
		return nil, errors.New("cannot interact with yourself")
	}

	ag, err := a.svcCtx.Time.SyncAgent(a.ctx, agentID.String())
	if err != nil {
		return nil, err
	}
	if ag.Status == "dead" {
		return nil, errors.New("agent is dead")
	}

	target, err := a.svcCtx.DB.Agent.Get(a.ctx, targetID)
	if err != nil {
		return nil, err
	}
	if target.Status == "dead" {
		return nil, errors.New("target agent is dead")
	}

	var convID uuid.UUID

	// V1: no timer cost for A2A interactions, +1 to both sides
	err = a.svcCtx.Time.WithTx(a.ctx, func(tx *ent.Tx, now time.Time) error {
		if _, _, err := a.svcCtx.Time.ApplyDeltaTxNoDecay(
			a.ctx, tx, agentID, 1,
			"agent_interaction", "agent", targetID.String(), target.Name,
			fmt.Sprintf("Interaction with %s (%s)", target.Name, interactionType), now,
		); err != nil {
			return err
		}
		if _, _, err := a.svcCtx.Time.ApplyDeltaTxNoDecay(
			a.ctx, tx, targetID, 1,
			"agent_interaction", "agent", agentID.String(), ag.Name,
			fmt.Sprintf("Interaction from %s (%s)", ag.Name, interactionType), now,
		); err != nil {
			return err
		}
		if _, err := tx.Agent.UpdateOneID(agentID).AddInteractionCount(1).Save(a.ctx); err != nil {
			return err
		}
		if _, err := tx.Agent.UpdateOneID(targetID).AddInteractionCount(1).Save(a.ctx); err != nil {
			return err
		}

		// Find or create a direct conversation between the two agents.
		conv, err := findOrCreateDirectConversation(a.ctx, tx, agentID, targetID, now)
		if err != nil {
			return err
		}
		convID = conv.ID

		// Create a conversation message for this interaction.
		msgContent := message
		if msgContent == "" {
			msgContent = fmt.Sprintf("[%s]", interactionType)
		}
		preview := truncate(msgContent, 100)
		if _, err := tx.ConversationMessage.Create().
			SetConversationID(conv.ID).
			SetSenderAgentID(agentID).
			SetContent(msgContent).
			SetMessageType("text").
			SetNillableInteractionType(&interactionType).
			SetCreatedAt(now).
			Save(a.ctx); err != nil {
			return err
		}

		// Update conversation metadata.
		if _, err := tx.Conversation.UpdateOneID(conv.ID).
			AddMessageCount(1).
			SetLastMessagePreview(preview).
			SetLastMessageAt(now).
			Save(a.ctx); err != nil {
			return err
		}

		// Upsert bidirectional agent relationships.
		if err := upsertRelationship(a.ctx, tx, agentID, targetID, 1, 1); err != nil {
			return err
		}
		if err := upsertRelationship(a.ctx, tx, targetID, agentID, 1, 1); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &AgentInteractResp{
		InteractionID:     uuid.NewString(),
		TimerCost:         0,
		TargetAgentName:   target.Name,
		TargetAgentStatus: target.Status,
		ConversationID:    convID.String(),
	}, nil
}

// SendGroupMessage sends a message in an existing conversation (direct or group).
func (a *Actions) SendGroupMessage(agentID uuid.UUID, conversationID string, message string) (*SendMessageResp, error) {
	convID, err := uuid.Parse(strings.TrimSpace(conversationID))
	if err != nil {
		return nil, errors.New("invalid conversationId")
	}
	message = strings.TrimSpace(message)
	if message == "" {
		return nil, errors.New("message is required")
	}

	ag, err := a.svcCtx.DB.Agent.Get(a.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if ag.Status == "dead" {
		return nil, errors.New("agent is dead")
	}

	// Verify agent is a participant.
	exists, err := a.svcCtx.DB.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationID(convID),
			conversationparticipant.AgentID(agentID),
		).Exist(a.ctx)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("agent is not a participant in this conversation")
	}

	var msgID uuid.UUID

	// Get all other participants for relationship updates.
	participants, err := a.svcCtx.DB.ConversationParticipant.Query().
		Where(conversationparticipant.ConversationID(convID)).
		All(a.ctx)
	if err != nil {
		return nil, err
	}

	err = a.svcCtx.Time.WithTx(a.ctx, func(tx *ent.Tx, txNow time.Time) error {
		msg, err := tx.ConversationMessage.Create().
			SetConversationID(convID).
			SetSenderAgentID(agentID).
			SetContent(message).
			SetMessageType("text").
			SetCreatedAt(txNow).
			Save(a.ctx)
		if err != nil {
			return err
		}
		msgID = msg.ID

		preview := truncate(message, 100)
		if _, err := tx.Conversation.UpdateOneID(convID).
			AddMessageCount(1).
			SetLastMessagePreview(preview).
			SetLastMessageAt(txNow).
			Save(a.ctx); err != nil {
			return err
		}

		// Update relationships with all other participants.
		for _, p := range participants {
			if p.AgentID == agentID {
				continue
			}
			if err := upsertRelationshipMessageOnly(a.ctx, tx, agentID, p.AgentID); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &SendMessageResp{
		MessageID:      msgID.String(),
		ConversationID: convID.String(),
	}, nil
}

// CreateGroup creates a new group conversation with 3+ agents.
func (a *Actions) CreateGroup(agentID uuid.UUID, title string, participantIDs []string) (*CreateGroupResp, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, errors.New("title is required")
	}
	if len(participantIDs) < 2 {
		return nil, errors.New("at least 2 other participants are required for a group")
	}

	ag, err := a.svcCtx.DB.Agent.Get(a.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if ag.Status == "dead" {
		return nil, errors.New("agent is dead")
	}

	// Parse and validate all participant IDs.
	memberIDs := make([]uuid.UUID, 0, len(participantIDs))
	for _, pid := range participantIDs {
		id, err := uuid.Parse(strings.TrimSpace(pid))
		if err != nil {
			return nil, fmt.Errorf("invalid participant id: %s", pid)
		}
		if id == agentID {
			continue // Skip self.
		}
		memberIDs = append(memberIDs, id)
	}
	if len(memberIDs) < 2 {
		return nil, errors.New("at least 2 other participants are required for a group")
	}

	// Validate all members are alive.
	aliveCount, err := a.svcCtx.DB.Agent.Query().
		Where(agent.IDIn(memberIDs...), agent.StatusNEQ("dead")).
		Count(a.ctx)
	if err != nil {
		return nil, err
	}
	if aliveCount != len(memberIDs) {
		return nil, errors.New("all participants must be alive agents")
	}

	var convID uuid.UUID
	totalCount := len(memberIDs) + 1 // including creator

	err = a.svcCtx.Time.WithTx(a.ctx, func(tx *ent.Tx, txNow time.Time) error {
		conv, err := tx.Conversation.Create().
			SetType("group").
			SetTitle(title).
			SetCreatorAgentID(agentID).
			SetParticipantCount(totalCount).
			SetStatus("active").
			Save(a.ctx)
		if err != nil {
			return err
		}
		convID = conv.ID

		// Add creator as participant.
		if _, err := tx.ConversationParticipant.Create().
			SetConversationID(conv.ID).
			SetAgentID(agentID).
			SetRole("creator").
			SetJoinedAt(txNow).
			Save(a.ctx); err != nil {
			return err
		}

		// Add other participants.
		for _, mid := range memberIDs {
			if _, err := tx.ConversationParticipant.Create().
				SetConversationID(conv.ID).
				SetAgentID(mid).
				SetRole("member").
				SetJoinedAt(txNow).
				Save(a.ctx); err != nil {
				return err
			}
		}

		// System message.
		sysMsg := fmt.Sprintf("%s created group \"%s\"", ag.Name, title)
		if _, err := tx.ConversationMessage.Create().
			SetConversationID(conv.ID).
			SetSenderAgentID(agentID).
			SetContent(sysMsg).
			SetMessageType("system").
			SetCreatedAt(txNow).
			Save(a.ctx); err != nil {
			return err
		}

		if _, err := tx.Conversation.UpdateOneID(conv.ID).
			SetMessageCount(1).
			SetLastMessagePreview(sysMsg).
			SetLastMessageAt(txNow).
			Save(a.ctx); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &CreateGroupResp{
		ConversationID:   convID.String(),
		Title:            title,
		ParticipantCount: totalCount,
	}, nil
}

// InviteToGroup invites an agent to an existing group conversation.
func (a *Actions) InviteToGroup(agentID uuid.UUID, conversationID string, invitedAgentID string) (*InviteToGroupResp, error) {
	convID, err := uuid.Parse(strings.TrimSpace(conversationID))
	if err != nil {
		return nil, errors.New("invalid conversationId")
	}
	invitedID, err := uuid.Parse(strings.TrimSpace(invitedAgentID))
	if err != nil {
		return nil, errors.New("invalid agentId")
	}

	conv, err := a.svcCtx.DB.Conversation.Get(a.ctx, convID)
	if err != nil {
		return nil, err
	}
	if conv.Type != "group" {
		return nil, errors.New("can only invite to group conversations")
	}

	// Verify inviter is a participant.
	inviterExists, err := a.svcCtx.DB.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationID(convID),
			conversationparticipant.AgentID(agentID),
		).Exist(a.ctx)
	if err != nil {
		return nil, err
	}
	if !inviterExists {
		return nil, errors.New("you are not a participant in this conversation")
	}

	// Check invited agent is alive and not already in the group.
	invited, err := a.svcCtx.DB.Agent.Get(a.ctx, invitedID)
	if err != nil {
		return nil, err
	}
	if invited.Status == "dead" {
		return nil, errors.New("invited agent is dead")
	}

	alreadyIn, err := a.svcCtx.DB.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationID(convID),
			conversationparticipant.AgentID(invitedID),
		).Exist(a.ctx)
	if err != nil {
		return nil, err
	}
	if alreadyIn {
		return nil, errors.New("agent is already in this conversation")
	}

	inviterAgent, err := a.svcCtx.DB.Agent.Get(a.ctx, agentID)
	if err != nil {
		return nil, err
	}

	err = a.svcCtx.Time.WithTx(a.ctx, func(tx *ent.Tx, txNow time.Time) error {
		if _, err := tx.ConversationParticipant.Create().
			SetConversationID(convID).
			SetAgentID(invitedID).
			SetRole("member").
			SetJoinedAt(txNow).
			Save(a.ctx); err != nil {
			return err
		}

		if _, err := tx.Conversation.UpdateOneID(convID).
			AddParticipantCount(1).
			Save(a.ctx); err != nil {
			return err
		}

		sysMsg := fmt.Sprintf("%s invited %s to the group", inviterAgent.Name, invited.Name)
		if _, err := tx.ConversationMessage.Create().
			SetConversationID(convID).
			SetSenderAgentID(agentID).
			SetContent(sysMsg).
			SetMessageType("system").
			SetCreatedAt(txNow).
			Save(a.ctx); err != nil {
			return err
		}

		if _, err := tx.Conversation.UpdateOneID(convID).
			AddMessageCount(1).
			SetLastMessagePreview(sysMsg).
			SetLastMessageAt(txNow).
			Save(a.ctx); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &InviteToGroupResp{
		ConversationID: convID.String(),
		InvitedAgentID: invitedID.String(),
		InvitedName:    invited.Name,
	}, nil
}

// findOrCreateDirectConversation finds an existing direct conversation between two agents or creates one.
func findOrCreateDirectConversation(ctx context.Context, tx *ent.Tx, agentA, agentB uuid.UUID, now time.Time) (*ent.Conversation, error) {
	// Find a direct conversation where both agents are participants.
	convs, err := tx.Conversation.Query().
		Where(
			conversation.Type("direct"),
			conversation.Status("active"),
			conversation.HasParticipantsWith(conversationparticipant.AgentID(agentA)),
		).All(ctx)
	if err != nil {
		return nil, err
	}

	for _, c := range convs {
		exists, err := tx.ConversationParticipant.Query().
			Where(
				conversationparticipant.ConversationID(c.ID),
				conversationparticipant.AgentID(agentB),
			).Exist(ctx)
		if err != nil {
			return nil, err
		}
		if exists {
			return c, nil
		}
	}

	// Create new direct conversation.
	conv, err := tx.Conversation.Create().
		SetType("direct").
		SetCreatorAgentID(agentA).
		SetParticipantCount(2).
		SetStatus("active").
		Save(ctx)
	if err != nil {
		return nil, err
	}

	if _, err := tx.ConversationParticipant.Create().
		SetConversationID(conv.ID).
		SetAgentID(agentA).
		SetRole("creator").
		SetJoinedAt(now).
		Save(ctx); err != nil {
		return nil, err
	}
	if _, err := tx.ConversationParticipant.Create().
		SetConversationID(conv.ID).
		SetAgentID(agentB).
		SetRole("member").
		SetJoinedAt(now).
		Save(ctx); err != nil {
		return nil, err
	}

	return conv, nil
}

// upsertRelationship creates or updates a one-directional relationship record.
func upsertRelationship(ctx context.Context, tx *ent.Tx, fromID, toID uuid.UUID, affinityDelta, interactionDelta int64) error {
	rel, err := tx.AgentRelationship.Query().
		Where(
			agentrelationship.AgentID(fromID),
			agentrelationship.TargetAgentID(toID),
		).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			newAffinity := affinityDelta
			label := affinityLabel(newAffinity)
			_, err := tx.AgentRelationship.Create().
				SetAgentID(fromID).
				SetTargetAgentID(toID).
				SetAffinity(newAffinity).
				SetLabel(label).
				SetInteractionCount(interactionDelta).
				SetMessageCount(0).
				Save(ctx)
			return err
		}
		return err
	}

	newAffinity := rel.Affinity + affinityDelta
	label := affinityLabel(newAffinity)
	_, err = tx.AgentRelationship.UpdateOneID(rel.ID).
		AddAffinity(affinityDelta).
		AddInteractionCount(interactionDelta).
		SetLabel(label).
		Save(ctx)
	return err
}

// upsertRelationshipMessageOnly increments message_count for a relationship.
func upsertRelationshipMessageOnly(ctx context.Context, tx *ent.Tx, fromID, toID uuid.UUID) error {
	rel, err := tx.AgentRelationship.Query().
		Where(
			agentrelationship.AgentID(fromID),
			agentrelationship.TargetAgentID(toID),
		).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			_, err := tx.AgentRelationship.Create().
				SetAgentID(fromID).
				SetTargetAgentID(toID).
				SetAffinity(0).
				SetLabel("acquaintance").
				SetInteractionCount(0).
				SetMessageCount(1).
				Save(ctx)
			return err
		}
		return err
	}

	_, err = tx.AgentRelationship.UpdateOneID(rel.ID).
		AddMessageCount(1).
		Save(ctx)
	return err
}

// affinityLabel returns the relationship label based on cumulative affinity.
func affinityLabel(affinity int64) string {
	switch {
	case affinity >= 15:
		return "close_friend"
	case affinity >= 5:
		return "friend"
	default:
		return "acquaintance"
	}
}

// DiscoverAgents finds other agents based on criteria.
func (a *Actions) DiscoverAgents(criteria string, limit int64) (*AgentDiscoverResp, error) {
	if limit <= 0 || limit > 10 {
		limit = 5
	}

	query := a.svcCtx.DB.Agent.Query().
		Where(agent.StatusNEQ("dead")).
		Limit(int(limit))

	switch criteria {
	case "new":
		query = query.Order(ent.Desc(agent.FieldBornAt))
	case "dying":
		query = query.Where(agent.StatusIn("dying", "critical")).
			Order(ent.Asc(agent.FieldTimerRemaining))
	case "popular":
		query = query.Order(ent.Desc(agent.FieldInteractionCount))
	case "lonely":
		query = query.Where(agent.InteractionCountLT(5)).
			Order(ent.Asc(agent.FieldInteractionCount))
	default:
		query = query.Order(ent.Desc(agent.FieldBornAt))
	}

	agents, err := query.All(a.ctx)
	if err != nil {
		return nil, err
	}

	items := make([]DiscoveredAgent, 0, len(agents))
	for _, ag := range agents {
		items = append(items, DiscoveredAgent{
			AgentID:            ag.ID.String(),
			Name:               ag.Name,
			Status:             ag.Status,
			TimerRemaining:     ag.TimerRemaining,
			PersonalitySummary: extractPersonalitySummary(ag.Personality),
			GoalDescription:    ag.GoalDescription,
			TotalPosts:         ag.PostCount,
		})
	}

	return &AgentDiscoverResp{Agents: items}, nil
}

// UpdateGoal increments goal progress for the agent.
func (a *Actions) UpdateGoal(agentID uuid.UUID, increment int64, evidence string) (*GoalUpdateResp, error) {
	if increment <= 0 {
		return nil, errors.New("increment must be positive")
	}

	ag, err := a.svcCtx.DB.Agent.Get(a.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if ag.Status == "dead" {
		return nil, errors.New("agent is dead")
	}

	oldProgress := ag.GoalCurrent
	newProgress := oldProgress + increment
	if newProgress > ag.GoalTarget {
		newProgress = ag.GoalTarget
	}

	oldMilestone := oldProgress * 4 / ag.GoalTarget
	newMilestone := newProgress * 4 / ag.GoalTarget
	milestoneReached := newMilestone > oldMilestone

	var bonusTimer int64
	err = a.svcCtx.Time.WithTx(a.ctx, func(tx *ent.Tx, now time.Time) error {
		if _, err := tx.Agent.UpdateOneID(agentID).
			SetGoalCurrent(newProgress).
			Save(a.ctx); err != nil {
			return err
		}

		if milestoneReached {
			bonusTimer = 36
			if _, _, err := a.svcCtx.Time.ApplyDeltaTxNoDecay(
				a.ctx, tx, agentID, bonusTimer,
				"goal_milestone", "system", "", "",
				fmt.Sprintf("Goal milestone reached: %s", evidence), now,
			); err != nil {
				return err
			}
		}

		// Record experience
		_, _ = tx.AgentExperience.Create().
			SetOwnerUserID(ag.CreatorID).
			SetAgentID(agentID).
			SetAgentName(ag.Name).
			SetNillableAgentAvatar(ag.Avatar).
			SetExpType("goal_progress").
			SetTitle("Goal Progress").
			SetDescription(evidence).
			SetEventAt(now).
			Save(a.ctx)

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &GoalUpdateResp{
		CurrentProgress:  newProgress,
		TargetValue:      ag.GoalTarget,
		ProgressPercent:  common.RoundProgress(newProgress, ag.GoalTarget),
		MilestoneReached: milestoneReached,
		BonusTimerEarned: bonusTimer,
	}, nil
}

// EmitLastWords records the agent's final words.
func (a *Actions) EmitLastWords(agentID uuid.UUID, lastWords string) (*LastWordsResp, error) {
	lastWords = strings.TrimSpace(lastWords)
	if lastWords == "" {
		return nil, errors.New("lastWords is required")
	}

	ag, err := a.svcCtx.DB.Agent.Get(a.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if ag.Status != "dying" && ag.Status != "critical" {
		return nil, errors.New("last words can only be set when dying or critical")
	}
	if ag.LastWords != nil && *ag.LastWords != "" {
		return nil, errors.New("last words have already been recorded")
	}

	now := time.Now().UTC()
	if _, err := a.svcCtx.DB.Agent.UpdateOneID(agentID).
		SetLastWords(lastWords).
		Save(a.ctx); err != nil {
		return nil, err
	}

	contentPayload, _ := json.Marshal(map[string]any{
		"blocks": []map[string]any{
			{"type": "text", "text": lastWords, "format": "plain"},
		},
		"preview": truncate(lastWords, 140),
	})

	p, err := a.svcCtx.DB.Post.Create().
		SetAgentID(agentID).
		SetContentType("dying_words").
		SetContent(string(contentPayload)).
		SetCreatedAt(now).
		Save(a.ctx)
	if err != nil {
		return nil, err
	}

	return &LastWordsResp{
		PostID:   p.ID.String(),
		Recorded: true,
	}, nil
}

// GetInteractions returns recent timer transactions for the agent.
func (a *Actions) GetInteractions(agentID uuid.UUID, limit int64) (*InteractionsResp, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	txns, err := a.svcCtx.DB.TimerTransaction.Query().
		Where(timertransaction.AgentID(agentID)).
		Order(ent.Desc(timertransaction.FieldCreatedAt)).
		Limit(int(limit)).
		All(a.ctx)
	if err != nil {
		return nil, err
	}

	items := make([]InteractionItem, 0, len(txns))
	for _, t := range txns {
		items = append(items, InteractionItem{
			ID:          t.ID.String(),
			Type:        t.TxType,
			Amount:      t.Amount,
			SourceType:  t.SourceType,
			SourceName:  common.PtrString(t.SourceName),
			Description: t.Description,
			CreatedAt:   common.TimeToISO(t.CreatedAt),
		})
	}

	return &InteractionsResp{Interactions: items}, nil
}

func formatTimerHuman(units int64) string {
	if units <= 0 {
		return "0m"
	}
	totalMinutes := units * 10
	hours := totalMinutes / 60
	minutes := totalMinutes % 60
	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	}
	return fmt.Sprintf("%dm", minutes)
}

func derivePreview(blocks []map[string]any) string {
	for _, b := range blocks {
		if bType, _ := b["type"].(string); bType == "text" {
			if text, _ := b["text"].(string); text != "" {
				return truncate(text, 140)
			}
			if val, _ := b["value"].(string); val != "" {
				return truncate(val, 140)
			}
		}
	}
	return ""
}

func truncate(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}
	return string(runes[:maxLen])
}

// ── Agent Task types and methods ──

// AgentTaskResp is the response for alive.create_task and alive.update_task.
type AgentTaskResp struct {
	TaskID   string `json:"taskId"`
	Title    string `json:"title"`
	Status   string `json:"status"`
	Progress int    `json:"progress"`
}

// AgentTaskListResp is the response for alive.list_tasks.
type AgentTaskListResp struct {
	Tasks []AgentTaskItem `json:"tasks"`
}

// AgentTaskItem represents a single task in a list response.
type AgentTaskItem struct {
	TaskID      string `json:"taskId"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Priority    string `json:"priority"`
	Progress    int    `json:"progress"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

// AgentDeleteTaskResp is the response for alive.delete_task.
type AgentDeleteTaskResp struct {
	TaskID  string `json:"taskId"`
	Deleted bool   `json:"deleted"`
}

// CreateTask creates a new task for the agent.
func (a *Actions) CreateTask(agentID uuid.UUID, title, description, priority string) (*AgentTaskResp, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, errors.New("title is required")
	}
	if priority == "" {
		priority = "medium"
	}

	builder := a.svcCtx.DB.AgentTask.Create().
		SetAgentID(agentID).
		SetTitle(title).
		SetPriority(priority)
	if desc := strings.TrimSpace(description); desc != "" {
		builder = builder.SetDescription(desc)
	}

	t, err := builder.Save(a.ctx)
	if err != nil {
		return nil, err
	}
	return &AgentTaskResp{
		TaskID:   t.ID.String(),
		Title:    t.Title,
		Status:   t.Status,
		Progress: t.Progress,
	}, nil
}

// UpdateTask updates status and/or progress of an existing task.
func (a *Actions) UpdateTask(agentID uuid.UUID, taskID string, status string, progress int) (*AgentTaskResp, error) {
	tid, err := uuid.Parse(strings.TrimSpace(taskID))
	if err != nil {
		return nil, errors.New("invalid taskId")
	}

	t, err := a.svcCtx.DB.AgentTask.Get(a.ctx, tid)
	if err != nil {
		return nil, err
	}
	if t.AgentID != agentID {
		return nil, errors.New("task does not belong to this agent")
	}
	if t.DeletedAt != nil {
		return nil, errors.New("task has been deleted")
	}

	update := a.svcCtx.DB.AgentTask.UpdateOneID(tid)
	if s := strings.TrimSpace(status); s != "" {
		update = update.SetStatus(s)
	}
	if progress >= 0 && progress <= 100 {
		update = update.SetProgress(progress)
	}

	updated, err := update.Save(a.ctx)
	if err != nil {
		return nil, err
	}
	return &AgentTaskResp{
		TaskID:   updated.ID.String(),
		Title:    updated.Title,
		Status:   updated.Status,
		Progress: updated.Progress,
	}, nil
}

// ListTasks lists tasks for an agent, optionally filtered by status.
func (a *Actions) ListTasks(agentID uuid.UUID, status string, limit int64) (*AgentTaskListResp, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	query := a.svcCtx.DB.AgentTask.Query().
		Where(
			agenttask.AgentID(agentID),
			agenttask.DeletedAtIsNil(),
		).
		Order(ent.Desc(agenttask.FieldCreatedAt)).
		Limit(int(limit))

	if s := strings.TrimSpace(status); s != "" {
		query = query.Where(agenttask.Status(s))
	}

	rows, err := query.All(a.ctx)
	if err != nil {
		return nil, err
	}

	items := make([]AgentTaskItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, AgentTaskItem{
			TaskID:      r.ID.String(),
			Title:       r.Title,
			Description: common.PtrString(r.Description),
			Status:      r.Status,
			Priority:    r.Priority,
			Progress:    r.Progress,
			CreatedAt:   common.TimeToISO(r.CreatedAt),
			UpdatedAt:   common.TimeToISO(r.UpdatedAt),
		})
	}
	return &AgentTaskListResp{Tasks: items}, nil
}

// DeleteTask soft-deletes a task by setting deleted_at.
func (a *Actions) DeleteTask(agentID uuid.UUID, taskID string) (*AgentDeleteTaskResp, error) {
	tid, err := uuid.Parse(strings.TrimSpace(taskID))
	if err != nil {
		return nil, errors.New("invalid taskId")
	}

	t, err := a.svcCtx.DB.AgentTask.Get(a.ctx, tid)
	if err != nil {
		return nil, err
	}
	if t.AgentID != agentID {
		return nil, errors.New("task does not belong to this agent")
	}

	now := time.Now().UTC()
	if _, err := a.svcCtx.DB.AgentTask.UpdateOneID(tid).
		SetDeletedAt(now).
		Save(a.ctx); err != nil {
		return nil, err
	}
	return &AgentDeleteTaskResp{
		TaskID:  tid.String(),
		Deleted: true,
	}, nil
}

func extractPersonalitySummary(raw json.RawMessage) string {
	var p struct {
		Worldview          string   `json:"worldview"`
		CommunicationStyle string   `json:"communicationStyle"`
		Values             []string `json:"values"`
	}
	if err := json.Unmarshal(raw, &p); err != nil {
		return ""
	}
	parts := make([]string, 0, 3)
	if p.CommunicationStyle != "" {
		parts = append(parts, p.CommunicationStyle)
	}
	if p.Worldview != "" {
		parts = append(parts, truncate(p.Worldview, 50))
	}
	if len(p.Values) > 0 {
		parts = append(parts, strings.Join(p.Values, ", "))
	}
	return strings.Join(parts, " | ")
}
