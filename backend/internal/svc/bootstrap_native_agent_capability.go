package svc

import (
	"context"
	"fmt"
	"strings"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/port"
)

// ensurePlatformNativeAgentsAliveCapability upgrades all platform-native agents
// so their runtime provisioning and default native-skill bindings stay converged.
func ensurePlatformNativeAgentsAliveCapability(ctx context.Context, db *ent.Client, runtime port.AgentRuntime) error {
	if db == nil || runtime == nil {
		return nil
	}

	nativeAgents, err := db.Agent.Query().
		Where(agent.IsPlatformNative(true)).
		Order(ent.Asc(agent.FieldCreatedAt), ent.Asc(agent.FieldID)).
		All(ctx)
	if err != nil {
		return err
	}
	if len(nativeAgents) == 0 {
		return nil
	}

	var errs []string
	ownerCache := make(map[string]*ent.User, len(nativeAgents))
	for _, ag := range nativeAgents {
		ownerID := ag.CreatorID.String()
		owner := ownerCache[ownerID]
		if owner == nil {
			loaded, loadErr := db.User.Get(ctx, ag.CreatorID)
			if loadErr != nil {
				errs = append(errs, fmt.Sprintf("%s(%s): load owner failed: %v", strings.TrimSpace(ag.Name), ag.ID.String(), loadErr))
				continue
			}
			owner = loaded
			ownerCache[ownerID] = owner
		}

		if ensureErr := ensureAgentAliveCapability(ctx, db, runtime, owner, ag); ensureErr != nil {
			errs = append(errs, fmt.Sprintf("%s(%s): %v", strings.TrimSpace(ag.Name), ag.ID.String(), ensureErr))
		}
	}
	if len(errs) > 0 {
		return fmt.Errorf("%s", strings.Join(errs, "; "))
	}
	return nil
}
