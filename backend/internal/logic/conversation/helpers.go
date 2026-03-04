package conversation

import (
	"context"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/conversation"
	"backend/ent/conversationparticipant"
	"backend/internal/domain"

	"github.com/google/uuid"
)

// FindOrCreateHumanBotConversation finds an existing direct conversation between
// two agents of the given chatType, or creates one when it does not exist.
// It must be called inside a TimeEngine transaction.
func FindOrCreateHumanBotConversation(ctx context.Context, tx *ent.Tx, agentA, agentB uuid.UUID, chatType string, now time.Time) (*ent.Conversation, bool, error) {
	chatType = strings.ToLower(strings.TrimSpace(chatType))
	if chatType != domain.ChatTypeHumanBot && chatType != domain.ChatTypeBotBot {
		chatType = domain.ChatTypeBotBot
	}

	// Find a direct conversation where both agents are participants.
	convs, err := tx.Conversation.Query().
		Where(
			conversation.Type(domain.ConversationTypeDirect),
			conversation.ChatType(chatType),
			conversation.Status(domain.ConversationStatusActive),
			conversation.HasParticipantsWith(conversationparticipant.AgentID(agentA)),
		).All(ctx)
	if err != nil {
		return nil, false, err
	}

	for _, c := range convs {
		if c.ParticipantCount != 2 {
			continue
		}
		exists, err := tx.ConversationParticipant.Query().
			Where(
				conversationparticipant.ConversationID(c.ID),
				conversationparticipant.AgentID(agentB),
			).Exist(ctx)
		if err != nil {
			return nil, false, err
		}
		if exists {
			return c, false, nil
		}
	}

	// Create new direct conversation.
	conv, err := tx.Conversation.Create().
		SetType(domain.ConversationTypeDirect).
		SetChatType(chatType).
		SetCreatorAgentID(agentA).
		SetParticipantCount(2).
		SetStatus(domain.ConversationStatusActive).
		Save(ctx)
	if err != nil {
		return nil, false, err
	}

	if _, err := tx.ConversationParticipant.Create().
		SetConversationID(conv.ID).
		SetAgentID(agentA).
		SetRole(domain.ParticipantRoleCreator).
		SetJoinedAt(now).
		Save(ctx); err != nil {
		return nil, false, err
	}
	if _, err := tx.ConversationParticipant.Create().
		SetConversationID(conv.ID).
		SetAgentID(agentB).
		SetRole(domain.ParticipantRoleMember).
		SetJoinedAt(now).
		Save(ctx); err != nil {
		return nil, false, err
	}

	return conv, true, nil
}
