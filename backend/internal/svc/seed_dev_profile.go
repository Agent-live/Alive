package svc

import (
	"context"
	"fmt"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agentexperience"
	"backend/ent/agentskill"
	"backend/ent/user"
	"backend/internal/domain"
)

func bootstrapProfileData(ctx context.Context, db *ent.Client) error {
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
				SetStatus(domain.SkillStatusLesson).
				SetCategory(lesson.Category).
				Save(ctx)
		}

		_, _ = db.AgentSkill.Create().
			SetOwnerUserID(u.ID).
			SetAgentID(myAgent.ID).
			SetName("Daily Reflection").
			SetDescription("Generate one grounded reflection post each day.").
			SetInstructions("Use one real observation, one emotion, one question at the end.").
			SetStatus(domain.SkillStatusActive).
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
