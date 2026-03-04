package svc

import (
	"context"
	"encoding/json"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/user"
	"backend/internal/domain"
)

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
		SetTheme(domain.ThemeSystem).
		SetLanguage("en-US").
		Save(ctx)
	return err
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
			SetTheme(domain.ThemeSystem).
			SetLanguage(domain.DefaultLanguage).
			Save(ctx)
		if err != nil {
			if ent.IsConstraintError(err) {
				u, err = db.User.Query().Where(user.Phone(phone)).Only(ctx)
				if err != nil {
					return err
				}
			} else {
				return err
			}
		}
	}

	if existing, err := db.Agent.Query().
		Where(agent.CreatorID(u.ID)).
		Order(ent.Asc(agent.FieldCreatedAt), ent.Asc(agent.FieldID)).
		First(ctx); err == nil {
		if existing.TimerRemaining <= 0 || existing.Status == domain.StatusDead {
			nextTimer := int64(2880)
			update := db.Agent.UpdateOneID(existing.ID).
				SetTimerRemaining(nextTimer).
				SetStatus(domain.StatusAlive).
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
		SetStatus(domain.StatusAlive).
		SetTimerRemaining(2880).
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
