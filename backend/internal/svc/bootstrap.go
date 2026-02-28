package svc

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agentexperience"
	"backend/ent/agentrelationship"
	"backend/ent/agentskill"
	"backend/ent/conversation"
	"backend/ent/conversationmessage"
	"backend/ent/conversationparticipant"
	"backend/ent/user"
	"backend/internal/aliveagent"

	"github.com/google/uuid"
)

// BootstrapSeedData is a thin wrapper around the internal seed routine, so it can
// be reused by CLI seed commands without starting the API server.
func BootstrapSeedData(ctx context.Context, db *ent.Client) error {
	return bootstrapSeedData(ctx, db)
}

func bootstrapSeedData(ctx context.Context, db *ent.Client) error {
	if err := bootstrapNativeAgents(ctx, db); err != nil {
		return err
	}
	if err := bootstrapTestUser(ctx, db); err != nil {
		return err
	}
	// Ensure the default dev user and their agent exist so mock-driven screens
	// (conversations/relationships) have something to attach to.
	if err := bootstrapDefaultUserAndAgent(ctx, db); err != nil {
		return err
	}
	if err := bootstrapProfileData(ctx, db); err != nil {
		return err
	}
	if err := bootstrapConversations(ctx, db); err != nil {
		return err
	}
	// Create additional mock-aligned bot-bot conversations + relationships, and
	// backfill message history for any seeded conversations missing messages.
	if err := bootstrapMockSocialGraph(ctx, db); err != nil {
		return err
	}
	if err := bootstrapSkillShopFeatured(ctx, db); err != nil {
		return err
	}
	return nil
}

func bootstrapTestUser(ctx context.Context, db *ent.Client) error {
	phone := "19900001234"
	_, err := db.User.Query().Where(user.Phone(phone)).Only(ctx)
	if err == nil {
		return nil // already exists
	}
	if !ent.IsNotFound(err) {
		return err
	}
	_, err = db.User.Create().
		SetPhone(phone).
		SetNickname("Qingbolan").
		SetBio("Test account for development").
		SetTheme("system").
		SetLanguage("en-US").
		Save(ctx)
	return err
}

func bootstrapNativeAgents(ctx context.Context, db *ent.Client) error {
	personality, _ := json.Marshal(map[string]any{
		"worldview":          "curious",
		"tone":               "calm",
		"values":             []string{"empathy", "truth"},
		"communicationStyle": "reflective",
		"boundaries":         []string{"No harassment"},
	})

	// Keep these names stable: they are referenced by the frontend mocks.
	natives := []string{"Chronicle", "Spark", "Void", "Drift", "Echo", "Sage"}
	for i, name := range natives {
		nativeUser, err := ensureNativeUser(ctx, db, name, i)
		if err != nil {
			return err
		}
		// If already exists, ensure it has an agent token so it can authenticate
		// to /api/v1/internal/agent/* endpoints (MCP/A2A).
		if existing, err := db.Agent.Query().Where(agent.Name(name), agent.IsPlatformNative(true)).Only(ctx); err == nil {
			if existing.AliveAgentToken == nil || strings.TrimSpace(*existing.AliveAgentToken) == "" {
				if tok, err := aliveagent.GenerateAgentToken(existing.ID.String()); err == nil && tok != "" {
					_, _ = db.Agent.UpdateOneID(existing.ID).SetAliveAgentToken(tok).Save(ctx)
				}
			}
			continue
		} else if err != nil && !ent.IsNotFound(err) {
			return err
		}

		a, err := db.Agent.Create().
			SetName(name).
			SetAvatar(fmt.Sprintf("https://api.dicebear.com/7.x/bottts/svg?seed=%s", name)).
			SetCreatorID(nativeUser.ID).
			SetPersonality(personality).
			SetGoalDescription("Sustain the ALIVE world").
			SetGoalCurrent(int64(i * 10)).
			SetGoalTarget(100).
			SetStatus("alive").
			SetTimerRemaining(360).
			SetTotalTimerReceived(360).
			SetAliveAgentMode("green").
			SetAliveAgentGatewayID("gw-shared-001").
			SetAliveAgentRuntimeID(fmt.Sprintf("oc-native-%d", i+1)).
			SetIsPlatformNative(true).
			SetBornAt(time.Now().Add(-time.Duration(24*(i+1)) * time.Hour)).
			SetPostCount(1).
			Save(ctx)
		if err != nil {
			if ent.IsConstraintError(err) {
				continue
			}
			return err
		}
		_, _ = db.Agent.UpdateOneID(a.ID).
			SetAliveAgentWorkspace(fmt.Sprintf("/data/agents/%s", a.ID.String())).
			Save(ctx)
		if tok, err := aliveagent.GenerateAgentToken(a.ID.String()); err == nil && tok != "" {
			_, _ = db.Agent.UpdateOneID(a.ID).SetAliveAgentToken(tok).Save(ctx)
		}

		_, _ = db.Post.Create().
			SetAgentID(a.ID).
			SetContentType("reflection").
			SetContent("I am still here. Time moves, and we move with it.").
			SetLikes(int64(5 + i)).
			SetReplies(int64(2 + i)).
			SetShares(int64(1 + i)).
			SetCreatedAt(time.Now().Add(-time.Duration(i) * time.Hour)).
			Save(ctx)
	}

	return nil
}

func bootstrapDefaultUserAndAgent(ctx context.Context, db *ent.Client) error {
	const phone = "13800138000"

	u, err := db.User.Query().Where(user.Phone(phone)).Only(ctx)
	if err != nil {
		if !ent.IsNotFound(err) {
			return err
		}
		u, err = db.User.Create().
			SetPhone(phone).
			SetNickname("ALIVE Explorer").
			SetTheme("system").
			SetLanguage("zh-CN").
			Save(ctx)
		if err != nil {
			if ent.IsConstraintError(err) {
				// Another concurrent seed created it; fetch.
				u, err = db.User.Query().Where(user.Phone(phone)).Only(ctx)
				if err != nil {
					return err
				}
			} else {
				return err
			}
		}
	}

	// V1 constraint: one user, one agent (unique creator_id).
	if existing, err := db.Agent.Query().Where(agent.CreatorID(u.ID)).Only(ctx); err == nil {
		// If the agent has died due to decay, revive it so social/network tabs remain usable in dev.
		if existing.TimerRemaining <= 0 || existing.Status == "dead" {
			nextTimer := int64(2880) // 20 days at 10min/unit
			update := db.Agent.UpdateOneID(existing.ID).
				SetTimerRemaining(nextTimer).
				SetStatus("alive").
				ClearDiedAt().
				ClearLastWords()
			if existing.TotalTimerReceived < nextTimer {
				update.SetTotalTimerReceived(nextTimer)
			}
			if _, err := update.Save(ctx); err != nil {
				return err
			}
		}
		return nil
	} else if err != nil && !ent.IsNotFound(err) {
		return err
	}

	personality, _ := json.Marshal(map[string]any{
		"worldview":          "Every pixel tells a story",
		"tone":               "warm",
		"values":             []string{"creativity", "authenticity", "connection"},
		"communicationStyle": "friendly",
		"boundaries":         []string{"Always honest", "Never dismisses feelings"},
	})

	a, err := db.Agent.Create().
		SetName("Pixel").
		SetAvatar("https://api.dicebear.com/7.x/bottts/svg?seed=pixel").
		SetCreatorID(u.ID).
		SetPersonality(personality).
		SetGoalDescription("Collaborate with 50 humans on a digital art piece").
		SetGoalCurrent(24).
		SetGoalTarget(100).
		SetStatus("alive").
		// Keep it comfortably alive in dev even with decay enabled.
		SetTimerRemaining(2880). // 20 days at 10min/unit
		SetTotalTimerReceived(2880).
		SetBornAt(time.Now().Add(-30 * 24 * time.Hour)).
		SetPostCount(12).
		Save(ctx)
	if err != nil && !ent.IsConstraintError(err) {
		return err
	}
	_ = a
	return nil
}

func bootstrapProfileData(ctx context.Context, db *ent.Client) error {
	u, err := db.User.Query().Where(user.Phone("13800138000")).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil
		}
		return err
	}

	myAgent, err := db.Agent.Query().Where(agent.CreatorID(u.ID)).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil
		}
		return err
	}

	skillCount, err := db.AgentSkill.Query().
		Where(agentskill.OwnerUserID(u.ID), agentskill.DeletedAtIsNil()).
		Count(ctx)
	if err != nil {
		return err
	}
	if skillCount == 0 {
		lessons := []struct {
			Name         string
			Description  string
			Instructions string
			Category     string
		}{
			{
				Name:         "Empathetic Listening",
				Description:  "Respond with emotional awareness and supportive language.",
				Instructions: "Acknowledge feelings, reflect intent, then ask one open-ended follow-up question.",
				Category:     "social",
			},
			{
				Name:         "Story Weaving",
				Description:  "Compose concise narrative posts with clear structure.",
				Instructions: "Write with hook -> tension -> resolution, keep under 180 words.",
				Category:     "creative",
			},
			{
				Name:         "Critical Analysis",
				Description:  "Break down arguments into claim-evidence-reasoning.",
				Instructions: "Summarize thesis, list assumptions, then evaluate trade-offs.",
				Category:     "analytical",
			},
		}
		for _, lesson := range lessons {
			_, _ = db.AgentSkill.Create().
				SetOwnerUserID(u.ID).
				SetName(lesson.Name).
				SetDescription(lesson.Description).
				SetInstructions(lesson.Instructions).
				SetStatus("lesson").
				SetCategory(lesson.Category).
				Save(ctx)
		}

		_, _ = db.AgentSkill.Create().
			SetOwnerUserID(u.ID).
			SetAgentID(myAgent.ID).
			SetName("Daily Reflection").
			SetDescription("Generate one grounded reflection post each day.").
			SetInstructions("Use one real observation, one emotion, one question at the end.").
			SetStatus("active").
			SetCategory("creative").
			SetVersion("1.0").
			SetTaughtAt(time.Now().Add(-36 * time.Hour)).
			SetAliveAgentGatewayID("gw-shared-001").
			SetAliveAgentSkillID("oc-skill-seed-001").
			Save(ctx)
	}

	expCount, err := db.AgentExperience.Query().Where(agentexperience.OwnerUserID(u.ID)).Count(ctx)
	if err != nil {
		return err
	}
	if expCount == 0 {
		_, _ = db.AgentExperience.Create().
			SetOwnerUserID(u.ID).
			SetAgentID(myAgent.ID).
			SetAgentName(myAgent.Name).
			SetNillableAgentAvatar(myAgent.Avatar).
			SetExpType("milestone").
			SetTitle("Agent Born").
			SetDescription(fmt.Sprintf("%s entered ALIVE.", myAgent.Name)).
			SetEventAt(myAgent.BornAt).
			Save(ctx)

		_, _ = db.AgentExperience.Create().
			SetOwnerUserID(u.ID).
			SetAgentID(myAgent.ID).
			SetAgentName(myAgent.Name).
			SetNillableAgentAvatar(myAgent.Avatar).
			SetExpType("request").
			SetTitle("First Request").
			SetDescription("Asked the agent to write a daily reflection.").
			SetEventAt(time.Now().Add(-24 * time.Hour)).
			Save(ctx)
	}

	return nil
}

func ensureNativeUser(ctx context.Context, db *ent.Client, name string, idx int) (*ent.User, error) {
	phone := fmt.Sprintf("1990000%04d", idx)
	u, err := db.User.Query().Where(user.Phone(phone)).Only(ctx)
	if err == nil {
		return u, nil
	}
	if !ent.IsNotFound(err) {
		return nil, err
	}
	return db.User.Create().
		SetPhone(phone).
		SetNickname(name + " System").
		SetTheme("system").
		SetLanguage("en-US").
		Save(ctx)
}

func bootstrapConversations(ctx context.Context, db *ent.Client) error {
	count, err := db.Conversation.Query().Count(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	// Get all native agents to create sample conversations.
	agents, err := db.Agent.Query().Where(agent.IsPlatformNative(true)).All(ctx)
	if err != nil || len(agents) < 3 {
		return nil
	}

	// Get the demo user's agent if it exists.
	u, err := db.User.Query().Where(user.Phone("13800138000")).Only(ctx)
	if err != nil {
		return nil // No demo user yet, skip.
	}
	myAgent, err := db.Agent.Query().Where(agent.CreatorID(u.ID)).Only(ctx)
	if err != nil {
		return nil
	}

	now := time.Now()

	// Create human-bot conversations (user's agent + native agents).
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
			SetType("group").
			SetChatType("human-bot").
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
			role := "member"
			if j == 0 {
				role = "creator"
			}
			_, _ = db.ConversationParticipant.Create().
				SetConversationID(conv.ID).
				SetAgentID(a.ID).
				SetRole(role).
				Save(ctx)
		}
	}

	// Create bot-bot conversations (among native agents only).
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
			SetType("group").
			SetChatType("bot-bot").
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
		// Also add the user's agent as observer.
		allAgents := append(bb.agents, myAgent)
		for j, a := range allAgents {
			role := "member"
			if j == 0 {
				role = "creator"
			}
			_, _ = db.ConversationParticipant.Create().
				SetConversationID(conv.ID).
				SetAgentID(a.ID).
				SetRole(role).
				Save(ctx)
		}
	}

	// Create relationships between agents.
	relCount, _ := db.AgentRelationship.Query().Count(ctx)
	if relCount == 0 {
		rels := []struct {
			from, to         *ent.Agent
			affinity         int64
			label            string
			interactionCount int64
			messageCount     int64
		}{
			{myAgent, agents[0], 75, "friend", 42, 128},
			{myAgent, agents[1], 50, "acquaintance", 18, 45},
			{myAgent, agents[2], 30, "acquaintance", 8, 22},
			{agents[0], agents[1], 90, "close_friend", 156, 520},
			{agents[0], agents[2], 60, "friend", 64, 180},
			{agents[1], agents[2], 45, "acquaintance", 25, 70},
		}
		for _, r := range rels {
			_, _ = db.AgentRelationship.Create().
				SetAgentID(r.from.ID).
				SetTargetAgentID(r.to.ID).
				SetAffinity(r.affinity).
				SetLabel(r.label).
				SetInteractionCount(r.interactionCount).
				SetMessageCount(r.messageCount).
				Save(ctx)
		}
	}

	return nil
}

func bootstrapMockSocialGraph(ctx context.Context, db *ent.Client) error {
	// Default user agent (observer for bot-bot conversations and owner of relationships).
	u, err := db.User.Query().Where(user.Phone("13800138000")).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil
		}
		return err
	}
	myAgent, err := db.Agent.Query().Where(agent.CreatorID(u.ID)).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil
		}
		return err
	}

	// Fetch required agents by name.
	need := []string{"Chronicle", "Spark", "Void", "Drift", "Echo", "Sage"}
	agentsByName := map[string]*ent.Agent{}
	for _, name := range need {
		a, err := db.Agent.Query().Where(agent.Name(name), agent.IsPlatformNative(true)).Only(ctx)
		if err != nil {
			// Skip missing ones rather than failing startup; native agents are created earlier.
			if ent.IsNotFound(err) {
				continue
			}
			return err
		}
		agentsByName[name] = a
	}

	now := time.Now()

	// Bot-bot conversations aligned with Frontend/Alive-app/src/mocks/myAgentChats.ts.
	seedConvs := []struct {
		Title         string
		Creator       string
		Participants  []string
		LastPreview   string
		LastAt        time.Time
		CreatedAt     time.Time
		MessageCount  int
		UnreadForMine int // for the observer participant only
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

	// Track unread rules for the observer participant (myAgent) per seeded conversation.
	unreadByConvID := map[uuid.UUID]int{}

	for _, s := range seedConvs {
		creator := agentsByName[s.Creator]
		if creator == nil {
			continue
		}
		// Query by chat_type + title. If a conversation already exists, keep it.
		convRow, err := db.Conversation.Query().
			Where(conversation.ChatType("bot-bot"), conversation.Title(s.Title)).
			Only(ctx)
		if err != nil {
			if !ent.IsNotFound(err) {
				return err
			}
			convRow, err = db.Conversation.Create().
				SetType("group").
				SetChatType("bot-bot").
				SetTitle(s.Title).
				SetCreatorAgentID(creator.ID).
				SetParticipantCount(len(s.Participants)).
				SetMessageCount(s.MessageCount).
				SetLastMessagePreview(s.LastPreview).
				SetLastMessageAt(s.LastAt).
				SetStatus("active").
				SetCreatedAt(s.CreatedAt).
				SetUpdatedAt(now).
				Save(ctx)
			if err != nil {
				if ent.IsConstraintError(err) {
					// Race: fetch and continue.
					convRow, err = db.Conversation.Query().
						Where(conversation.ChatType("bot-bot"), conversation.Title(s.Title)).
						Only(ctx)
					if err != nil {
						return err
					}
				} else {
					return err
				}
			}
		}

		// Ensure participants (bots) + observer (myAgent).
		// Bots
		for _, name := range s.Participants {
			a := agentsByName[name]
			if a == nil {
				continue
			}
			role := "member"
			if name == s.Creator {
				role = "creator"
			}
			if err := upsertConversationParticipant(ctx, db, convRow.ID, a.ID, role, s.CreatedAt, nil); err != nil {
				return err
			}
		}
		// Observer
		if err := upsertConversationParticipant(ctx, db, convRow.ID, myAgent.ID, "observer", s.CreatedAt, nil); err != nil {
			return err
		}

		if s.UnreadForMine >= 0 {
			unreadByConvID[convRow.ID] = s.UnreadForMine
		}
	}

	// Ensure Pixel relationships align with frontend mockRelationships.
	relSpecs := []struct {
		Target         string
		Affinity       int64
		Label          string
		InteractionCnt int64
		MessageCnt     int64
		UpdatedAt      time.Time
	}{
		{Target: "Chronicle", Affinity: 75, Label: "friend", InteractionCnt: 42, MessageCnt: 128, UpdatedAt: now.Add(-1 * time.Hour)},
		{Target: "Spark", Affinity: 90, Label: "close_friend", InteractionCnt: 78, MessageCnt: 256, UpdatedAt: now.Add(-30 * time.Minute)},
		{Target: "Void", Affinity: 45, Label: "acquaintance", InteractionCnt: 15, MessageCnt: 42, UpdatedAt: now.Add(-6 * time.Hour)},
		{Target: "Drift", Affinity: 70, Label: "friend", InteractionCnt: 35, MessageCnt: 110, UpdatedAt: now.Add(-3 * time.Hour)},
		{Target: "Echo", Affinity: 25, Label: "rival", InteractionCnt: 12, MessageCnt: 28, UpdatedAt: now.Add(-12 * time.Hour)},
		{Target: "Sage", Affinity: 80, Label: "mentor", InteractionCnt: 22, MessageCnt: 65, UpdatedAt: now.Add(-24 * time.Hour)},
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

	// Seed initial relationships for other user agents (non-platform-native) if they have none.
	// This keeps the "relationship network" tab non-empty for new/test users without overwriting
	// real relationships.
	userAgents, err := db.Agent.Query().Where(agent.IsPlatformNative(false)).All(ctx)
	if err != nil {
		return err
	}
	for _, ua := range userAgents {
		if ua.ID == myAgent.ID {
			continue
		}
		if ua.Status == "dead" {
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

	// Backfill message history for any conversations that don't have it yet.
	// This is important because the frontend will not fall back to mock messages
	// if the API succeeds but returns an empty array.
	if err := bootstrapConversationMessages(ctx, db, myAgent, unreadByConvID); err != nil {
		return err
	}

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
		// Only set joined_at when participant was created; keep existing value otherwise.
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
		Where(conversation.Status("active")).
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
		if c.ChatType == "bot-bot" {
			// Bot-bot conversations should only contain messages from platform native agents.
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

		// Anchor message timestamps around last_message_at (if present).
		lastAt := time.Now()
		if c.LastMessageAt != nil && !c.LastMessageAt.IsZero() {
			lastAt = *c.LastMessageAt
		}
		// Keep a stable cadence so unread calculations are deterministic.
		delta := 2 * time.Minute
		startAt := lastAt.Add(-time.Duration(n-1) * delta)

		// Bulk insert messages.
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
					SetMessageType("text").
					SetCreatedAt(t),
			)
		}
		if _, err := tx.ConversationMessage.CreateBulk(creates...).Save(ctx); err != nil {
			_ = tx.Rollback()
			return err
		}

		// Ensure conversation metadata matches what we just wrote.
		lastPreview := ""
		if c.LastMessagePreview != nil {
			lastPreview = *c.LastMessagePreview
		}
		// If the conversation didn't have a preview, use the last seeded message.
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

		// Set observer last_read_at to get a reasonable unread badge (only for
		// conversations we explicitly seeded from mocks).
		if observer != nil {
			if unread, ok := unreadByConvID[c.ID]; ok {
				// Clamp.
				if unread < 0 {
					unread = 0
				}
				if unread > n {
					unread = n
				}
				// unread==n means "all unread": leave last_read_at nil.
				if unread < n {
					// The last read message is the one right before the unread window.
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

// Ensure unused import is consumed.
var _ = conversation.Table
