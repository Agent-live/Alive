package nativeskill

import (
	"context"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/internal/domain"
	"backend/internal/port"

	"github.com/google/uuid"
)

// BindSeeds ensures DB records and runtime bindings for one set of native skill seeds.
func BindSeeds(
	ctx context.Context,
	db *ent.Client,
	runtime port.AgentRuntime,
	ownerID uuid.UUID,
	target *ent.Agent,
	seeds []domain.NativeSkillSeed,
) error {
	if db == nil {
		return fmt.Errorf("db is required")
	}
	if runtime == nil {
		return fmt.Errorf("runtime is required")
	}
	if target == nil {
		return fmt.Errorf("target agent is required")
	}

	var errs []string
	for _, seed := range seeds {
		rec, err := EnsureActiveNativeSkillRecord(ctx, db, ownerID, target.ID, seed)
		if err != nil {
			errs = append(errs, fmt.Sprintf("%s: ensure db record failed: %v", seed.Name, err))
			continue
		}

		binding, err := runtime.BindSkill(ctx, port.BindSkillRequest{
			AgentID:      target.ID.String(),
			SkillName:    strings.TrimSpace(rec.Name),
			Description:  strings.TrimSpace(rec.Description),
			Instructions: strings.TrimSpace(rec.Instructions),
		})
		if err != nil {
			errs = append(errs, fmt.Sprintf("%s: bind failed: %v", seed.Name, err))
			continue
		}

		if _, err := db.AgentSkill.UpdateOneID(rec.ID).
			SetStatus(domain.SkillStatusActive).
			SetAgentID(target.ID).
			SetDescription(strings.TrimSpace(rec.Description)).
			SetInstructions(strings.TrimSpace(rec.Instructions)).
			SetCategory(strings.TrimSpace(rec.Category)).
			SetAliveAgentGatewayID(strings.TrimSpace(binding.GatewayID)).
			SetAliveAgentSkillID(strings.TrimSpace(binding.SkillID)).
			SetTaughtAt(time.Now()).
			Save(ctx); err != nil {
			errs = append(errs, fmt.Sprintf("%s: update bound record failed: %v", seed.Name, err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("%s", strings.Join(errs, "; "))
	}
	return nil
}
