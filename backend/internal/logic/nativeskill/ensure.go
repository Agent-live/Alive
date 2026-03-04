package nativeskill

import (
	"context"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agentskill"
	"backend/internal/domain"

	"github.com/google/uuid"
)

// EnsureActiveNativeSkillRecord ensures one active DB skill row exists for this seed.
func EnsureActiveNativeSkillRecord(
	ctx context.Context,
	db *ent.Client,
	ownerID uuid.UUID,
	agentID uuid.UUID,
	seed domain.NativeSkillSeed,
) (*ent.AgentSkill, error) {
	if db == nil {
		return nil, fmt.Errorf("db is required")
	}

	name := strings.TrimSpace(seed.Name)
	if name == "" {
		return nil, fmt.Errorf("skill name is required")
	}
	instructions := strings.TrimSpace(seed.Instructions)
	if instructions == "" {
		return nil, fmt.Errorf("skill instructions are required")
	}
	description := strings.TrimSpace(seed.Description)
	if description == "" {
		description = "ALIVE native platform skill"
	}
	category := strings.TrimSpace(seed.Category)
	if category == "" {
		category = "platform_native"
	}

	rec, err := db.AgentSkill.Query().
		Where(
			agentskill.OwnerUserID(ownerID),
			agentskill.AgentID(agentID),
			agentskill.Name(name),
			agentskill.DeletedAtIsNil(),
		).
		Order(
			ent.Desc(agentskill.FieldUpdatedAt),
			ent.Desc(agentskill.FieldCreatedAt),
		).
		First(ctx)
	if err == nil {
		return db.AgentSkill.UpdateOneID(rec.ID).
			SetStatus(domain.SkillStatusActive).
			SetDescription(description).
			SetInstructions(instructions).
			SetCategory(category).
			SetTaughtAt(time.Now()).
			Save(ctx)
	}
	if !ent.IsNotFound(err) {
		return nil, err
	}

	return db.AgentSkill.Create().
		SetOwnerUserID(ownerID).
		SetAgentID(agentID).
		SetName(name).
		SetDescription(description).
		SetInstructions(instructions).
		SetStatus(domain.SkillStatusActive).
		SetCategory(category).
		SetTaughtAt(time.Now()).
		Save(ctx)
}
