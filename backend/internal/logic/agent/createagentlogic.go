package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/internal/domain"
	"backend/internal/gateway"
	"backend/internal/logic/common"
	"backend/internal/logic/notify"
	"backend/internal/mapper"
	"backend/internal/port"
	"backend/internal/provisioning"
	"backend/internal/selector"
	"backend/internal/service/timeengine"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type CreateAgentLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateAgentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateAgentLogic {
	return &CreateAgentLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateAgentLogic) CreateAgent(req *types.CreateAgentReq) (resp *types.AgentResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	ownedAgents, err := selector.LoadOwnedAgentsForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err != nil {
		return nil, err
	}
	maxSlots := selector.MaxAgentSlotsForUser(u)
	usedSlots := selector.CountOccupiedAgentSlots(ownedAgents)
	if maxSlots > 0 && usedSlots >= maxSlots {
		return nil, errors.New("agent slot limit reached")
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, errors.New("agent name is required")
	}

	personalityRaw, err := json.Marshal(req.Personality)
	if err != nil {
		return nil, err
	}
	goal := strings.TrimSpace(req.GoalDescription)
	if goal == "" {
		goal = "Survive and build meaningful connections"
	}

	seed := strings.TrimSpace(req.AvatarSeed)
	if seed == "" {
		seed = strings.ToLower(strings.ReplaceAll(name, " ", "-"))
	}
	avatar := fmt.Sprintf("https://api.dicebear.com/7.x/bottts/svg?seed=%s", seed)

	now := time.Now().UTC()
	newID := uuid.New()

	agentToken, err := gateway.GenerateAgentToken(newID.String())
	if err != nil {
		return nil, err
	}

	// Step 1: Persist agent in DB first (status="provisioning") to avoid orphaned
	// external resources if the DB transaction fails.
	tx, err := l.svcCtx.DB.Tx(l.ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	a, err := tx.Agent.Create().
		SetID(newID).
		SetName(name).
		SetAvatar(avatar).
		SetCreatorID(u.ID).
		SetPersonality(personalityRaw).
		SetGoalDescription(goal).
		SetGoalTarget(100).
		SetStatus(domain.StatusProvisioning).
		SetTimerRemaining(timeengine.InitialTimer).
		SetTotalTimerReceived(timeengine.InitialTimer).
		SetAliveAgentMode("green").
		SetAliveAgentToken(agentToken).
		SetIsPlatformNative(false).
		SetBornAt(now).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	// Seed the timer ledger with the initial grant.
	_, err = tx.TimerTransaction.Create().
		SetTxType(domain.TxTypeSystemGrant).
		SetAmount(timeengine.InitialTimer).
		SetAgentID(a.ID).
		SetSourceType(domain.SourceSystem).
		SetDescription("Initial timer grant").
		SetBalanceAfter(timeengine.InitialTimer).
		SetCreatedAt(now).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	_, err = tx.User.UpdateOneID(u.ID).AddAgentsCreated(1).Save(l.ctx)
	if err != nil {
		return nil, err
	}

	_, _ = tx.AgentExperience.Create().
		SetOwnerUserID(u.ID).
		SetAgentID(a.ID).
		SetAgentName(a.Name).
		SetNillableAgentAvatar(a.Avatar).
		SetExpType("milestone").
		SetTitle("Agent Born").
		SetDescription(fmt.Sprintf("%s entered ALIVE.", a.Name)).
		SetEventAt(now).
		Save(l.ctx)

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// Step 2: Provision agent externally (HTTP call to AliveAgent runtime).
	provSoul := provisioning.BuildProvisionSoul(name, personalityRaw)
	provNativeSkills := provisioning.BuildProvisionNativeSkills(domain.DefaultPlatformNativeSkillSeeds)
	prov, provErr := l.svcCtx.AgentRuntime.ProvisionAgent(l.ctx, port.ProvisionAgentRequest{
		AgentID:         newID.String(),
		Name:            name,
		Soul:            provSoul,
		GoalDescription: goal,
		Personality:     personalityRaw,
		UserSettings: &port.ProvisionAgentUserSettings{
			UserID:   u.ID.String(),
			Nickname: strings.TrimSpace(u.Nickname),
			Theme:    strings.TrimSpace(u.Theme),
			Language: strings.TrimSpace(u.Language),
		},
		NativeSkills: provNativeSkills,
	})

	// Step 3: Update agent with provisioning result.
	var warnings []string
	provisionSucceeded := provErr == nil
	if provErr != nil {
		// Mark as provision_failed but still return the agent so the user can retry.
		l.Errorf("provision failed for agent %s: %v", newID.String(), provErr)
		_, _ = l.svcCtx.DB.Agent.UpdateOneID(newID).SetStatus(domain.StatusProvisionFailed).Save(l.ctx)
		warnings = append(warnings, "provisioning failed, retry later")
	} else {
		a, err = l.svcCtx.DB.Agent.UpdateOneID(newID).
			SetStatus(domain.StatusNewborn).
			SetAliveAgentGatewayID(prov.GatewayID).
			SetAliveAgentRuntimeID(prov.AgentRuntimeID).
			SetAliveAgentWorkspace(gateway.DefaultWorkspacePath(newID.String())).
			Save(l.ctx)
		if err != nil {
			return nil, err
		}
	}

	// Post-provision setup: native skills are part of the provisioning invariant.
	// If skill preinstall fails, keep the agent in provision_failed state.
	if provisionSucceeded {
		if preloadErr := l.PreinstallNativeSkills(u.ID, a); preloadErr != nil {
			l.Errorf("failed to preinstall native skills for agent %s: %v", a.ID.String(), preloadErr)
			warnings = append(warnings, "native skill provisioning failed, retry later")
			a, err = l.svcCtx.DB.Agent.UpdateOneID(newID).SetStatus(domain.StatusProvisionFailed).Save(l.ctx)
			if err != nil {
				return nil, err
			}
			provisionSucceeded = false
		}
	}

	if provisionSucceeded {
		runtimeAgentID := strings.TrimSpace(domain.PtrString(a.AliveAgentRuntimeID))
		if runtimeAgentID != "" {
			bornPayload := map[string]any{
				"agentId":         a.ID.String(),
				"runtimeAgentId":  runtimeAgentID,
				"agentName":       a.Name,
				"status":          strings.TrimSpace(a.Status),
				"timerRemaining":  a.TimerRemaining,
				"goalDescription": strings.TrimSpace(a.GoalDescription),
				"bornAt":          a.BornAt.UTC().Format(time.RFC3339),
			}
			if workspace := strings.TrimSpace(domain.PtrString(a.AliveAgentWorkspace)); workspace != "" {
				bornPayload["workspace"] = workspace
			}
			notify.NewEmitter(context.Background(), l.svcCtx).EmitEventToAgentIDWithRuntimeID(
				a.ID.String(), runtimeAgentID,
				"lifecycle.agent_born", "ALIVE Agent Born", "ALIVE agent creation committed",
				domain.BuildDedupeKey(a.ID.String(), "lifecycle.agent_born", a.BornAt.UTC().Format("20060102150405")),
				bornPayload,
			)
		}
	}

	out := mapper.ToAgentResp(a, u.Nickname, nil)
	out.Warnings = warnings
	return &out, nil
}

func (l *CreateAgentLogic) PreinstallNativeSkills(ownerID uuid.UUID, target *ent.Agent) error {
	return PreinstallNativeSkillBindings(l.ctx, l.svcCtx.DB, l.svcCtx.AgentRuntime, ownerID, target)
}
