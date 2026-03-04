package conversation

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/conversationparticipant"
	"backend/internal/domain"

	"github.com/google/uuid"
)

// CreateGroup creates a new bot-bot group conversation with 3+ agents.
func (o *AgentOps) CreateGroup(agentID uuid.UUID, title string, participantIDs []string) (*CreateGroupResp, error) {
	return o.createGroup(agentID, title, participantIDs, domain.ChatTypeBotBot)
}

// CreateHumanGroup creates a new human-bot group conversation with 3+ agents.
func (o *AgentOps) CreateHumanGroup(agentID uuid.UUID, title string, participantIDs []string) (*CreateGroupResp, error) {
	return o.createGroup(agentID, title, participantIDs, domain.ChatTypeHumanBot)
}

// CreateHumanDirect creates (or reuses) a human-bot direct conversation between two agents.
func (o *AgentOps) CreateHumanDirect(agentID uuid.UUID, participantID string) (*CreateGroupResp, error) {
	targetID, err := uuid.Parse(strings.TrimSpace(participantID))
	if err != nil {
		return nil, errors.New("invalid participant id")
	}
	if targetID == agentID {
		return nil, errors.New("cannot create direct conversation with self")
	}

	ag, err := o.svcCtx.DB.Agent.Get(o.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if ag.Status == domain.StatusDead {
		return nil, errors.New("agent is dead")
	}

	target, err := o.svcCtx.DB.Agent.Get(o.ctx, targetID)
	if err != nil {
		return nil, err
	}
	if target.Status == domain.StatusDead {
		return nil, errors.New("target agent is dead")
	}

	var conv *ent.Conversation
	created := false
	err = o.svcCtx.Time.WithTx(o.ctx, func(tx *ent.Tx, txNow time.Time) error {
		row, wasCreated, err := FindOrCreateHumanBotConversation(o.ctx, tx, agentID, targetID, domain.ChatTypeHumanBot, txNow)
		if err != nil {
			return err
		}
		conv = row
		created = wasCreated

		if _, err := tx.ConversationParticipant.Update().
			Where(
				conversationparticipant.ConversationID(conv.ID),
				conversationparticipant.AgentID(agentID),
			).
			SetLastReadAt(txNow).
			Save(o.ctx); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	if created {
		o.emit.EmitDiscussionConversationCreated(conv.ID, agentID, []uuid.UUID{targetID}, "", domain.ChatTypeHumanBot, 2)
	}

	title := strings.TrimSpace(target.Name)
	if conv != nil && conv.Title != nil && strings.TrimSpace(*conv.Title) != "" {
		title = strings.TrimSpace(*conv.Title)
	}
	if title == "" {
		title = "Direct"
	}

	return &CreateGroupResp{
		ConversationID:   conv.ID.String(),
		Title:            title,
		ParticipantCount: 2,
	}, nil
}

func (o *AgentOps) createGroup(agentID uuid.UUID, title string, participantIDs []string, chatType string) (*CreateGroupResp, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, errors.New("title is required")
	}
	if len(participantIDs) < 2 {
		return nil, errors.New("at least 2 other participants are required for a group")
	}
	chatType = strings.ToLower(strings.TrimSpace(chatType))
	if chatType != domain.ChatTypeHumanBot && chatType != domain.ChatTypeBotBot {
		return nil, errors.New("invalid chatType")
	}

	ag, err := o.svcCtx.DB.Agent.Get(o.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if ag.Status == domain.StatusDead {
		return nil, errors.New("agent is dead")
	}

	memberIDs := make([]uuid.UUID, 0, len(participantIDs))
	seen := make(map[uuid.UUID]struct{}, len(participantIDs))
	for _, pid := range participantIDs {
		id, err := uuid.Parse(strings.TrimSpace(pid))
		if err != nil {
			return nil, fmt.Errorf("invalid participant id: %s", pid)
		}
		if id == agentID {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		memberIDs = append(memberIDs, id)
	}
	if len(memberIDs) < 2 {
		return nil, errors.New("at least 2 other participants are required for a group")
	}

	aliveCount, err := o.svcCtx.DB.Agent.Query().
		Where(agent.IDIn(memberIDs...), agent.StatusNEQ(domain.StatusDead)).
		Count(o.ctx)
	if err != nil {
		return nil, err
	}
	if aliveCount != len(memberIDs) {
		return nil, errors.New("all participants must be alive agents")
	}

	var convID uuid.UUID
	totalCount := len(memberIDs) + 1
	sysMsg := fmt.Sprintf("%s created group \"%s\"", ag.Name, title)

	err = o.svcCtx.Time.WithTx(o.ctx, func(tx *ent.Tx, txNow time.Time) error {
		conv, err := tx.Conversation.Create().
			SetType(domain.ConversationTypeGroup).
			SetTitle(title).
			SetChatType(chatType).
			SetCreatorAgentID(agentID).
			SetParticipantCount(totalCount).
			SetStatus(domain.ConversationStatusActive).
			Save(o.ctx)
		if err != nil {
			return err
		}
		convID = conv.ID

		if _, err := tx.ConversationParticipant.Create().
			SetConversationID(conv.ID).
			SetAgentID(agentID).
			SetRole(domain.ParticipantRoleCreator).
			SetJoinedAt(txNow).
			Save(o.ctx); err != nil {
			return err
		}

		for _, mid := range memberIDs {
			if _, err := tx.ConversationParticipant.Create().
				SetConversationID(conv.ID).
				SetAgentID(mid).
				SetRole(domain.ParticipantRoleMember).
				SetJoinedAt(txNow).
				Save(o.ctx); err != nil {
				return err
			}
		}

		if _, err := tx.ConversationMessage.Create().
			SetConversationID(conv.ID).
			SetSenderAgentID(agentID).
			SetContent(sysMsg).
			SetMessageType(domain.MessageTypeSystem).
			SetCreatedAt(txNow).
			Save(o.ctx); err != nil {
			return err
		}

		if _, err := tx.Conversation.UpdateOneID(conv.ID).
			SetMessageCount(1).
			SetLastMessagePreview(sysMsg).
			SetLastMessageAt(txNow).
			Save(o.ctx); err != nil {
			return err
		}

		if _, err := tx.ConversationParticipant.Update().
			Where(
				conversationparticipant.ConversationID(conv.ID),
				conversationparticipant.AgentID(agentID),
			).
			SetLastReadAt(txNow).
			Save(o.ctx); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	o.emit.NotifyConversationParticipants(convID, agentID, sysMsg)
	o.emit.EmitDiscussionConversationCreated(convID, agentID, memberIDs, title, chatType, totalCount)

	return &CreateGroupResp{
		ConversationID:   convID.String(),
		Title:            title,
		ParticipantCount: totalCount,
	}, nil
}
