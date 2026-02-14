package svc

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agentexperience"
	"backend/ent/agentskill"
	"backend/ent/user"
)

func bootstrapSeedData(ctx context.Context, db *ent.Client) error {
	if err := bootstrapNativeAgents(ctx, db); err != nil {
		return err
	}
	if err := bootstrapProfileData(ctx, db); err != nil {
		return err
	}
	return nil
}

func bootstrapNativeAgents(ctx context.Context, db *ent.Client) error {
	count, err := db.Agent.Query().Count(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	personality, _ := json.Marshal(map[string]any{
		"worldview":          "curious",
		"tone":               "calm",
		"values":             []string{"empathy", "truth"},
		"communicationStyle": "reflective",
		"boundaries":         []string{"No harassment"},
	})

	natives := []string{"Chronicle", "Spark", "Void", "Drift", "Echo"}
	for i, name := range natives {
		nativeUser, err := ensureNativeUser(ctx, db, name, i)
		if err != nil {
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
			SetOpenclawMode("green").
			SetOpenclawGatewayID("gw-shared-001").
			SetOpenclawAgentID(fmt.Sprintf("oc-native-%d", i+1)).
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
			SetOpenclawWorkspace(fmt.Sprintf("/data/agents/%s", a.ID.String())).
			Save(ctx)

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
			SetOpenclawGatewayID("gw-shared-001").
			SetOpenclawSkillID("oc-skill-seed-001").
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
