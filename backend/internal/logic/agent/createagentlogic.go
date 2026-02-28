package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/aliveagent"
	"backend/internal/logic/common"
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

	if _, err = l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).Only(l.ctx); err == nil {
		return nil, errors.New("single-agent mode: user already has an agent")
	} else if !ent.IsNotFound(err) {
		return nil, err
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
	prov, err := l.svcCtx.AliveAgent.ProvisionAgent(l.ctx, aliveagent.ProvisionAgentRequest{AgentID: newID.String(), Name: name})
	if err != nil {
		return nil, err
	}

	agentToken, err := aliveagent.GenerateAgentToken(newID.String())
	if err != nil {
		return nil, err
	}

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
		SetStatus("newborn").
		SetTimerRemaining(timeengine.InitialTimer).
		SetTotalTimerReceived(timeengine.InitialTimer).
		SetAliveAgentMode("green").
		SetAliveAgentGatewayID(prov.GatewayID).
		SetAliveAgentRuntimeID(prov.AgentRuntimeID).
		SetAliveAgentWorkspace(prov.WorkspacePath).
		SetAliveAgentToken(agentToken).
		SetIsPlatformNative(false).
		SetBornAt(now).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	// Seed the timer ledger with the initial grant.
	_, err = tx.TimerTransaction.Create().
		SetTxType("system_grant").
		SetAmount(timeengine.InitialTimer).
		SetAgentID(a.ID).
		SetSourceType("system").
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

	// Initialize agent workspace (best-effort, non-blocking for creation)
	if initErr := l.svcCtx.AliveAgent.InitWorkspace(
		newID.String(), name, personalityRaw, goal, agentToken,
	); initErr != nil {
		l.Errorf("failed to init agent workspace: %v", initErr)
	}

	out := common.ToAgentResp(a, u.Nickname, nil)
	return &out, nil
}

func parseUUID(id string) (uuid.UUID, error) {
	return uuid.Parse(strings.TrimSpace(id))
}
