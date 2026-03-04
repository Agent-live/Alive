package selector

import (
	"context"
	"errors"
	"strings"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/domain"

	"github.com/google/uuid"
)

// SelectOwnedAgent chooses the acting agent from a user's owned agent set.
// If preferredAgentID is empty, prefer a living agent; otherwise fallback to first.
func SelectOwnedAgent(candidates []*ent.Agent, preferredAgentID string) (*ent.Agent, error) {
	if len(candidates) == 0 {
		return nil, errors.New("agent not found")
	}

	preferred := strings.TrimSpace(preferredAgentID)
	if preferred == "" {
		for _, item := range candidates {
			if item == nil {
				continue
			}
			if !strings.EqualFold(strings.TrimSpace(item.Status), domain.StatusDead) {
				return item, nil
			}
		}
		for _, item := range candidates {
			if item != nil {
				return item, nil
			}
		}
		return nil, errors.New("agent not found")
	}

	preferredUUID, err := uuid.Parse(preferred)
	if err != nil {
		return nil, errors.New("invalid agent id")
	}
	for _, item := range candidates {
		if item != nil && item.ID == preferredUUID {
			return item, nil
		}
	}

	return nil, errors.New("agent not found")
}

// LoadOwnedAgentsForUser loads all agents created by the given user, ordered by creation time.
func LoadOwnedAgentsForUser(
	ctx context.Context,
	db *ent.Client,
	userID uuid.UUID,
) ([]*ent.Agent, error) {
	return db.Agent.Query().
		Where(agent.CreatorID(userID)).
		Order(
			ent.Asc(agent.FieldCreatedAt),
			ent.Asc(agent.FieldID),
		).
		All(ctx)
}

// ResolveDefaultOwnedAgentForUser loads the user's agents and returns the default (first living) one.
func ResolveDefaultOwnedAgentForUser(
	ctx context.Context,
	db *ent.Client,
	userID uuid.UUID,
) (*ent.Agent, error) {
	rows, err := LoadOwnedAgentsForUser(ctx, db, userID)
	if err != nil {
		return nil, err
	}
	return SelectOwnedAgent(rows, "")
}

// ResolveOwnedAgentForUser resolves an acting agent for the user.
// It avoids .Only() so historical multi-agent rows do not cause 500 errors.
func ResolveOwnedAgentForUser(
	ctx context.Context,
	db *ent.Client,
	userID uuid.UUID,
	preferredAgentID string,
) (*ent.Agent, error) {
	rows, err := LoadOwnedAgentsForUser(ctx, db, userID)
	if err != nil {
		return nil, err
	}
	return SelectOwnedAgent(rows, preferredAgentID)
}

// CountOccupiedAgentSlots counts non-dead agents among the candidates.
func CountOccupiedAgentSlots(candidates []*ent.Agent) int64 {
	var used int64
	for _, item := range candidates {
		if item == nil {
			continue
		}
		if strings.EqualFold(strings.TrimSpace(item.Status), domain.StatusDead) {
			continue
		}
		used++
	}
	return used
}

// MaxAgentSlotsForUser returns the maximum number of agent slots for a user.
func MaxAgentSlotsForUser(_ *ent.User) int64 {
	return domain.DefaultMaxAgentSlots
}
