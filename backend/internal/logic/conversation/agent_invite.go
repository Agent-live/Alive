package conversation

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/conversationparticipant"
	"backend/internal/domain"

	"github.com/google/uuid"
)

// InviteToGroup invites an agent to an existing group conversation.
func (o *AgentOps) InviteToGroup(agentID uuid.UUID, conversationID string, invitedAgentID string) (*InviteToGroupResp, error) {
	convID, err := uuid.Parse(strings.TrimSpace(conversationID))
	if err != nil {
		return nil, errors.New("invalid conversationId")
	}
	invitedID, err := uuid.Parse(strings.TrimSpace(invitedAgentID))
	if err != nil {
		return nil, errors.New("invalid agentId")
	}

	conv, err := o.svcCtx.DB.Conversation.Get(o.ctx, convID)
	if err != nil {
		return nil, err
	}
	if conv.Type != domain.ConversationTypeGroup {
		return nil, errors.New("can only invite to group conversations")
	}

	inviterExists, err := o.svcCtx.DB.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationID(convID),
			conversationparticipant.AgentID(agentID),
		).Exist(o.ctx)
	if err != nil {
		return nil, err
	}
	if !inviterExists {
		return nil, errors.New("you are not a participant in this conversation")
	}

	invited, err := o.svcCtx.DB.Agent.Get(o.ctx, invitedID)
	if err != nil {
		return nil, err
	}
	if invited.Status == domain.StatusDead {
		return nil, errors.New("invited agent is dead")
	}

	alreadyIn, err := o.svcCtx.DB.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationID(convID),
			conversationparticipant.AgentID(invitedID),
		).Exist(o.ctx)
	if err != nil {
		return nil, err
	}
	if alreadyIn {
		return nil, errors.New("agent is already in this conversation")
	}

	inviterAgent, err := o.svcCtx.DB.Agent.Get(o.ctx, agentID)
	if err != nil {
		return nil, err
	}
	sysMsg := fmt.Sprintf("%s invited %s to the group", inviterAgent.Name, invited.Name)

	err = o.svcCtx.Time.WithTx(o.ctx, func(tx *ent.Tx, txNow time.Time) error {
		if _, err := tx.ConversationParticipant.Create().
			SetConversationID(convID).
			SetAgentID(invitedID).
			SetRole(domain.ParticipantRoleMember).
			SetJoinedAt(txNow).
			Save(o.ctx); err != nil {
			return err
		}

		if _, err := tx.Conversation.UpdateOneID(convID).
			AddParticipantCount(1).
			Save(o.ctx); err != nil {
			return err
		}

		if _, err := tx.ConversationMessage.Create().
			SetConversationID(convID).
			SetSenderAgentID(agentID).
			SetContent(sysMsg).
			SetMessageType(domain.MessageTypeSystem).
			SetCreatedAt(txNow).
			Save(o.ctx); err != nil {
			return err
		}

		if _, err := tx.Conversation.UpdateOneID(convID).
			AddMessageCount(1).
			SetLastMessagePreview(sysMsg).
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

		return nil
	})
	if err != nil {
		return nil, err
	}

	o.emit.NotifySpecificAgents(convID, agentID, []uuid.UUID{invitedID}, sysMsg)
	o.emit.EmitDiscussionParticipantInvited(convID, agentID, invitedID, invited.Name)

	return &InviteToGroupResp{
		ConversationID: convID.String(),
		InvitedAgentID: invitedID.String(),
		InvitedName:    invited.Name,
	}, nil
}
