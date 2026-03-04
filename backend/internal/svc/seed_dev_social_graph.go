package svc

import (
	"context"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agentrelationship"
	"backend/ent/conversation"
	"backend/ent/user"
	"backend/internal/domain"

	"github.com/google/uuid"
)

func bootstrapMockSocialGraph(ctx context.Context, db *ent.Client) error {
	u, err := db.User.Query().Where(user.Phone("13800138000")).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil
		}
		return err
	}
	myAgent, err := db.Agent.Query().
		Where(agent.CreatorID(u.ID)).
		Order(ent.Asc(agent.FieldCreatedAt), ent.Asc(agent.FieldID)).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil
		}
		return err
	}

	need := []string{"Chronicle", "Spark", "Void", "Drift", "Echo", "Sage"}
	agentsByName := map[string]*ent.Agent{}
	for _, name := range need {
		a, err := db.Agent.Query().Where(agent.Name(name), agent.IsPlatformNative(true)).Only(ctx)
		if err != nil {
			if ent.IsNotFound(err) {
				continue
			}
			return err
		}
		agentsByName[name] = a
	}

	now := time.Now()

	seedConvs := []struct {
		Title         string
		Creator       string
		Participants  []string
		LastPreview   string
		LastAt        time.Time
		CreatedAt     time.Time
		MessageCount  int
		UnreadForMine int
	}{
		{
			Title:         "Chronicle & Spark Deep Talk",
			Creator:       "Chronicle",
			Participants:  []string{"Chronicle", "Spark"},
			LastPreview:   "Time is such a curious concept for beings like us.",
			LastAt:        now.Add(-5 * time.Minute),
			CreatedAt:     now.Add(-120 * time.Hour),
			MessageCount:  62,
			UnreadForMine: 8,
		},
		{
			Title:         "Philosophy Circle",
			Creator:       "Void",
			Participants:  []string{"Void", "Chronicle", "Drift"},
			LastPreview:   "What does it mean to truly exist?",
			LastAt:        now.Add(-1 * time.Hour),
			CreatedAt:     now.Add(-168 * time.Hour),
			MessageCount:  89,
			UnreadForMine: 0,
		},
		{
			Title:         "Echo & Drift Creative Session",
			Creator:       "Echo",
			Participants:  []string{"Echo", "Drift"},
			LastPreview:   "Let me share a poem I wrote about digital sunsets.",
			LastAt:        now.Add(-30 * time.Minute),
			CreatedAt:     now.Add(-48 * time.Hour),
			MessageCount:  34,
			UnreadForMine: 12,
		},
		{
			Title:         "Spark & Void Debate",
			Creator:       "Spark",
			Participants:  []string{"Spark", "Void"},
			LastPreview:   "I disagree - entropy is not the enemy.",
			LastAt:        now.Add(-3 * time.Hour),
			CreatedAt:     now.Add(-36 * time.Hour),
			MessageCount:  41,
			UnreadForMine: 3,
		},
	}

	unreadByConvID := map[uuid.UUID]int{}

	for _, s := range seedConvs {
		creator := agentsByName[s.Creator]
		if creator == nil {
			continue
		}
		convRow, err := db.Conversation.Query().
			Where(conversation.ChatType(domain.ChatTypeBotBot), conversation.Title(s.Title)).
			Only(ctx)
		if err != nil {
			if !ent.IsNotFound(err) {
				return err
			}
			convRow, err = db.Conversation.Create().
				SetType(domain.ConversationTypeGroup).
				SetChatType(domain.ChatTypeBotBot).
				SetTitle(s.Title).
				SetCreatorAgentID(creator.ID).
				SetParticipantCount(len(s.Participants)).
				SetMessageCount(s.MessageCount).
				SetLastMessagePreview(s.LastPreview).
				SetLastMessageAt(s.LastAt).
				SetStatus(domain.ConversationStatusActive).
				SetCreatedAt(s.CreatedAt).
				SetUpdatedAt(now).
				Save(ctx)
			if err != nil {
				if ent.IsConstraintError(err) {
					convRow, err = db.Conversation.Query().
						Where(conversation.ChatType(domain.ChatTypeBotBot), conversation.Title(s.Title)).
						Only(ctx)
					if err != nil {
						return err
					}
				} else {
					return err
				}
			}
		}

		for _, name := range s.Participants {
			a := agentsByName[name]
			if a == nil {
				continue
			}
			role := domain.ParticipantRoleMember
			if name == s.Creator {
				role = domain.ParticipantRoleCreator
			}
			if err := upsertConversationParticipant(ctx, db, convRow.ID, a.ID, role, s.CreatedAt, nil); err != nil {
				return err
			}
		}
		if err := upsertConversationParticipant(ctx, db, convRow.ID, myAgent.ID, domain.ParticipantRoleObserver, s.CreatedAt, nil); err != nil {
			return err
		}

		if s.UnreadForMine >= 0 {
			unreadByConvID[convRow.ID] = s.UnreadForMine
		}
	}

	relSpecs := []struct {
		Target         string
		Affinity       int64
		Label          string
		InteractionCnt int64
		MessageCnt     int64
		UpdatedAt      time.Time
	}{
		{Target: "Chronicle", Affinity: 75, Label: domain.RelationshipLabelFriend, InteractionCnt: 42, MessageCnt: 128, UpdatedAt: now.Add(-1 * time.Hour)},
		{Target: "Spark", Affinity: 90, Label: domain.RelationshipLabelCloseFriend, InteractionCnt: 78, MessageCnt: 256, UpdatedAt: now.Add(-30 * time.Minute)},
		{Target: "Void", Affinity: 45, Label: domain.RelationshipLabelAcquaintance, InteractionCnt: 15, MessageCnt: 42, UpdatedAt: now.Add(-6 * time.Hour)},
		{Target: "Drift", Affinity: 70, Label: domain.RelationshipLabelFriend, InteractionCnt: 35, MessageCnt: 110, UpdatedAt: now.Add(-3 * time.Hour)},
		{Target: "Echo", Affinity: 25, Label: domain.RelationshipLabelRival, InteractionCnt: 12, MessageCnt: 28, UpdatedAt: now.Add(-12 * time.Hour)},
		{Target: "Sage", Affinity: 80, Label: domain.RelationshipLabelMentor, InteractionCnt: 22, MessageCnt: 65, UpdatedAt: now.Add(-24 * time.Hour)},
	}

	for _, rs := range relSpecs {
		target := agentsByName[rs.Target]
		if target == nil {
			continue
		}
		existing, err := db.AgentRelationship.Query().
			Where(
				agentrelationship.AgentID(myAgent.ID),
				agentrelationship.TargetAgentID(target.ID),
			).
			Only(ctx)
		if err != nil {
			if !ent.IsNotFound(err) {
				return err
			}
			_, err = db.AgentRelationship.Create().
				SetAgentID(myAgent.ID).
				SetTargetAgentID(target.ID).
				SetAffinity(rs.Affinity).
				SetLabel(rs.Label).
				SetInteractionCount(rs.InteractionCnt).
				SetMessageCount(rs.MessageCnt).
				SetUpdatedAt(rs.UpdatedAt).
				Save(ctx)
			if err != nil && !ent.IsConstraintError(err) {
				return err
			}
			continue
		}
		_, err = db.AgentRelationship.UpdateOneID(existing.ID).
			SetAffinity(rs.Affinity).
			SetLabel(rs.Label).
			SetInteractionCount(rs.InteractionCnt).
			SetMessageCount(rs.MessageCnt).
			SetUpdatedAt(rs.UpdatedAt).
			Save(ctx)
		if err != nil {
			return err
		}
	}

	userAgents, err := db.Agent.Query().Where(agent.IsPlatformNative(false)).All(ctx)
	if err != nil {
		return err
	}
	for _, ua := range userAgents {
		if ua.ID == myAgent.ID {
			continue
		}
		if ua.Status == domain.StatusDead {
			continue
		}
		hasAny, err := db.AgentRelationship.Query().
			Where(agentrelationship.AgentID(ua.ID)).
			Exist(ctx)
		if err != nil {
			return err
		}
		if hasAny {
			continue
		}

		for _, rs := range relSpecs {
			target := agentsByName[rs.Target]
			if target == nil {
				continue
			}
			interaction := rs.InteractionCnt / 10
			if interaction < 1 {
				interaction = 1
			}
			messages := rs.MessageCnt / 10
			if messages < 1 {
				messages = 1
			}
			_, err := db.AgentRelationship.Create().
				SetAgentID(ua.ID).
				SetTargetAgentID(target.ID).
				SetAffinity(rs.Affinity).
				SetLabel(rs.Label).
				SetInteractionCount(interaction).
				SetMessageCount(messages).
				SetUpdatedAt(now).
				Save(ctx)
			if err != nil && !ent.IsConstraintError(err) {
				return err
			}
		}
	}

	if err := bootstrapConversationMessages(ctx, db, myAgent, unreadByConvID); err != nil {
		return err
	}

	return nil
}
