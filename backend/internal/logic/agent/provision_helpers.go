package agent

import (
	"context"

	"backend/ent"
	"backend/internal/domain"
	nativeskilllogic "backend/internal/logic/nativeskill"
	"backend/internal/port"

	"github.com/google/uuid"
)

// PreinstallNativeSkillBindings ensures DB records and runtime bindings for all
// default platform native skills. Shared by CreateAgent and bootstrap flows.
func PreinstallNativeSkillBindings(
	ctx context.Context,
	db *ent.Client,
	runtime port.AgentRuntime,
	ownerID uuid.UUID,
	target *ent.Agent,
) error {
	return nativeskilllogic.BindSeeds(ctx, db, runtime, ownerID, target, domain.DefaultPlatformNativeSkillSeeds)
}
