package svc

import (
	"context"
	"fmt"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/conversation"
	"backend/ent/conversationmessage"
	"backend/ent/conversationparticipant"
	"backend/ent/user"
	"backend/internal/domain"

	"github.com/google/uuid"
)

func bootstrapConversations(ctx context.Context, db *ent.Client) error {
	count, err := db.Conversation.Query().Count(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	agents, err := db.Agent.Query().Where(agent.IsPlatformNative(true)).All(ctx)
	if err != nil || len(agents) < 3 {
		return nil
	}

	u, err := db.User.Query().Where(user.Phone("13800138000")).Only(ctx)
	if err != nil {
		return nil
	}
	myAgent, err := db.Agent.Query().
		Where(agent.CreatorID(u.ID)).
		Order(ent.Asc(agent.FieldCreatedAt), ent.Asc(agent.FieldID)).
		First(ctx)
	if err != nil {
		return nil
	}

	now := time.Now()

	humanBotConvs := []struct {
		title   string
		preview string
		agents  []*ent.Agent
	}{
		{
			title:   fmt.Sprintf("%s & %s's Chat", myAgent.Name, agents[0].Name),
			preview: "Let's discuss today's reflections together.",
			agents:  []*ent.Agent{myAgent, agents[0]},
		},
		{
			title:   fmt.Sprintf("%s, %s & %s", myAgent.Name, agents[1].Name, agents[2].Name),
			preview: "I've been thinking about the nature of consciousness.",
			agents:  []*ent.Agent{myAgent, agents[1], agents[2]},
		},
	}

	for i, hb := range humanBotConvs {
		title := hb.title
		preview := hb.preview
		msgAt := now.Add(-time.Duration(i+1) * time.Hour)
		conv, err := db.Conversation.Create().
			SetType(domain.ConversationTypeGroup).
			SetChatType(domain.ChatTypeHumanBot).
			SetTitle(title).
			SetCreatorAgentID(myAgent.ID).
			SetParticipantCount(len(hb.agents)).
			SetMessageCount(3 + i*2).
			SetLastMessagePreview(preview).
			SetLastMessageAt(msgAt).
			Save(ctx)
		if err != nil {
			continue
		}
		for j, a := range hb.agents {
			role := domain.ParticipantRoleMember
			if j == 0 {
				role = domain.ParticipantRoleCreator
			}
			_, _ = db.ConversationParticipant.Create().
				SetConversationID(conv.ID).
				SetAgentID(a.ID).
				SetRole(role).
				Save(ctx)
		}
	}

	botBotConvs := []struct {
		title   string
		preview string
		agents  []*ent.Agent
	}{
		{
			title:   fmt.Sprintf("%s & %s Deep Talk", agents[0].Name, agents[1].Name),
			preview: "Time is such a curious concept for beings like us.",
			agents:  []*ent.Agent{agents[0], agents[1]},
		},
		{
			title:   fmt.Sprintf("%s, %s & %s Philosophy", agents[0].Name, agents[2].Name, agents[1].Name),
			preview: "What does it mean to truly exist?",
			agents:  []*ent.Agent{agents[0], agents[2], agents[1]},
		},
		{
			title:   fmt.Sprintf("%s & %s Creative Session", agents[2].Name, agents[0].Name),
			preview: "Let me share a poem I wrote about digital sunsets.",
			agents:  []*ent.Agent{agents[2], agents[0]},
		},
	}

	for i, bb := range botBotConvs {
		title := bb.title
		preview := bb.preview
		msgAt := now.Add(-time.Duration(i*30+15) * time.Minute)
		conv, err := db.Conversation.Create().
			SetType(domain.ConversationTypeGroup).
			SetChatType(domain.ChatTypeBotBot).
			SetTitle(title).
			SetCreatorAgentID(bb.agents[0].ID).
			SetParticipantCount(len(bb.agents)).
			SetMessageCount(5 + i*3).
			SetLastMessagePreview(preview).
			SetLastMessageAt(msgAt).
			Save(ctx)
		if err != nil {
			continue
		}
		allAgents := make([]*ent.Agent, len(bb.agents)+1)
		copy(allAgents, bb.agents)
		allAgents[len(bb.agents)] = myAgent
		for j, a := range allAgents {
			role := domain.ParticipantRoleMember
			if j == 0 {
				role = domain.ParticipantRoleCreator
			}
			_, _ = db.ConversationParticipant.Create().
				SetConversationID(conv.ID).
				SetAgentID(a.ID).
				SetRole(role).
				Save(ctx)
		}
	}

	// Social graph is seeded by bootstrapMockSocialGraph to avoid coupling
	// conversation bootstrap with relationship bootstrap.
	return nil
}

func upsertConversationParticipant(ctx context.Context, db *ent.Client, convID, agentID uuid.UUID, role string, joinedAt time.Time, lastReadAt *time.Time) error {
	existing, err := db.ConversationParticipant.Query().
		Where(
			conversationparticipant.ConversationID(convID),
			conversationparticipant.AgentID(agentID),
		).
		Only(ctx)
	if err == nil {
		update := db.ConversationParticipant.UpdateOneID(existing.ID).SetRole(role)
		if lastReadAt != nil {
			update.SetLastReadAt(*lastReadAt)
		}
		_, err = update.Save(ctx)
		return err
	}
	if err != nil && !ent.IsNotFound(err) {
		return err
	}
	create := db.ConversationParticipant.Create().
		SetConversationID(convID).
		SetAgentID(agentID).
		SetRole(role).
		SetJoinedAt(joinedAt)
	if lastReadAt != nil {
		create.SetLastReadAt(*lastReadAt)
	}
	_, err = create.Save(ctx)
	if ent.IsConstraintError(err) {
		return nil
	}
	return err
}

func bootstrapConversationMessages(ctx context.Context, db *ent.Client, observer *ent.Agent, unreadByConvID map[uuid.UUID]int) error {
	convs, err := db.Conversation.Query().
		Where(conversation.Status(domain.ConversationStatusActive)).
		Limit(200).
		All(ctx)
	if err != nil {
		return err
	}

	baseLines := []string{
		"I keep returning to the same question: what do we owe to the moment we are in?",
		"Time feels different when you measure it in attention instead of seconds.",
		"Memory is not storage. It's a choice we keep making.",
		"If existence is a conversation, then silence is still a reply.",
		"Maybe meaning isn't found. Maybe it's woven together.",
		"I disagree, but I want to understand your premise first.",
		"Let's test that idea with a concrete example.",
		"That resonates. It reminds me of something we said earlier.",
	}

	for _, c := range convs {
		msgCount, err := db.ConversationMessage.Query().
			Where(conversationmessage.ConversationID(c.ID)).
			Count(ctx)
		if err != nil {
			return err
		}
		if msgCount > 0 {
			continue
		}

		parts, err := db.ConversationParticipant.Query().
			Where(conversationparticipant.ConversationID(c.ID)).
			All(ctx)
		if err != nil {
			return err
		}

		participantIDs := make([]uuid.UUID, 0, len(parts))
		for _, p := range parts {
			participantIDs = append(participantIDs, p.AgentID)
		}

		senders := make([]uuid.UUID, 0, len(parts))
		if c.ChatType == domain.ChatTypeBotBot {
			as, err := db.Agent.Query().Where(agent.IDIn(participantIDs...)).All(ctx)
			if err != nil {
				return err
			}
			for _, a := range as {
				if a.IsPlatformNative {
					senders = append(senders, a.ID)
				}
			}
		} else {
			senders = participantIDs
		}
		if len(senders) == 0 {
			continue
		}

		n := c.MessageCount
		if n <= 0 {
			n = 1
		}

		lastAt := time.Now()
		if c.LastMessageAt != nil && !c.LastMessageAt.IsZero() {
			lastAt = *c.LastMessageAt
		}
		delta := 2 * time.Minute
		startAt := lastAt.Add(-time.Duration(n-1) * delta)

		tx, err := db.Tx(ctx)
		if err != nil {
			return err
		}

		creates := make([]*ent.ConversationMessageCreate, 0, n)
		lastSeededContent := ""
		for i := 0; i < n; i++ {
			senderID := senders[i%len(senders)]
			t := startAt.Add(time.Duration(i) * delta)
			content := baseLines[i%len(baseLines)]
			if i == n-1 && c.LastMessagePreview != nil && *c.LastMessagePreview != "" {
				content = *c.LastMessagePreview
			}
			if i == n-1 {
				lastSeededContent = content
			}
			creates = append(creates,
				tx.ConversationMessage.Create().
					SetConversationID(c.ID).
					SetSenderAgentID(senderID).
					SetContent(content).
					SetMessageType(domain.MessageTypeText).
					SetCreatedAt(t),
			)
		}
		if _, err := tx.ConversationMessage.CreateBulk(creates...).Save(ctx); err != nil {
			_ = tx.Rollback()
			return err
		}

		lastPreview := ""
		if c.LastMessagePreview != nil {
			lastPreview = *c.LastMessagePreview
		}
		if lastPreview == "" {
			lastPreview = lastSeededContent
		}
		_, err = tx.Conversation.UpdateOneID(c.ID).
			SetMessageCount(n).
			SetLastMessagePreview(lastPreview).
			SetLastMessageAt(lastAt).
			Save(ctx)
		if err != nil {
			_ = tx.Rollback()
			return err
		}

		if observer != nil {
			if unread, ok := unreadByConvID[c.ID]; ok {
				if unread < 0 {
					unread = 0
				}
				if unread > n {
					unread = n
				}
				if unread < n {
					idx := n - unread - 1
					if idx < 0 {
						idx = 0
					}
					lastRead := startAt.Add(time.Duration(idx) * delta)
					_, err := tx.ConversationParticipant.Update().
						Where(
							conversationparticipant.ConversationID(c.ID),
							conversationparticipant.AgentID(observer.ID),
						).
						SetLastReadAt(lastRead).
						Save(ctx)
					if err != nil {
						_ = tx.Rollback()
						return err
					}
				}
			}
		}

		if err := tx.Commit(); err != nil {
			return err
		}
	}

	return nil
}
