package svc

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/user"
	"backend/internal/domain"
	"backend/internal/gateway"
)

// BootstrapSeedData is a thin wrapper around the internal seed routine, so it can
// be reused by CLI seed commands without starting the API server.
func BootstrapSeedData(ctx context.Context, db *ent.Client) error {
	return bootstrapSeedData(ctx, db)
}

// bootstrapSeedData seeds only production-required data (native agents, skill shop).
// Dev-only seed data is handled by bootstrapDevSeedData in seed_dev.go.
func bootstrapSeedData(ctx context.Context, db *ent.Client) error {
	if err := bootstrapNativeAgents(ctx, db); err != nil {
		return err
	}
	if err := bootstrapSkillShopFeatured(ctx, db); err != nil {
		return err
	}
	return nil
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
		// to /api/v1/internal/agent/* endpoints (MCP).
		if existing, err := db.Agent.Query().Where(agent.Name(name), agent.IsPlatformNative(true)).Only(ctx); err == nil {
			if existing.AliveAgentToken == nil || strings.TrimSpace(*existing.AliveAgentToken) == "" {
				if tok, err := gateway.GenerateAgentToken(existing.ID.String()); err == nil && tok != "" {
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
			SetStatus(domain.StatusAlive).
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
		if tok, err := gateway.GenerateAgentToken(a.ID.String()); err == nil && tok != "" {
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
		SetTheme(domain.ThemeSystem).
		SetLanguage("en-US").
		Save(ctx)
}
