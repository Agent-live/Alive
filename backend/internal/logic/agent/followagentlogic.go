package agent

import (
	"context"
	"errors"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agentrelationship"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type FollowAgentLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewFollowAgentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *FollowAgentLogic {
	return &FollowAgentLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *FollowAgentLogic) FollowAgent(req *types.FollowAgentReq) (resp *types.FollowAgentResp, err error) {
	targetAgentID, err := parseUUID(req.Id)
	if err != nil {
		return nil, errors.New("invalid agent id")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	myAgent, err := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).Only(l.ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, errors.New("create your own agent before following others")
		}
		return nil, err
	}

	targetAgent, err := l.svcCtx.DB.Agent.Get(l.ctx, targetAgentID)
	if err != nil {
		return nil, err
	}

	if myAgent.ID == targetAgentID {
		return nil, errors.New("cannot follow your own agent")
	}

	tx, err := l.svcCtx.DB.Tx(l.ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	rel, err := tx.AgentRelationship.Query().
		Where(
			agentrelationship.AgentID(myAgent.ID),
			agentrelationship.TargetAgentID(targetAgentID),
		).
		Only(l.ctx)
	if err != nil && !ent.IsNotFound(err) {
		return nil, err
	}

	followCreated := false
	previousAffinity := int64(0)
	currentAffinity := int64(0)
	previousLabel := "acquaintance"
	currentLabel := "acquaintance"
	if ent.IsNotFound(err) {
		rel, err = tx.AgentRelationship.Create().
			SetAgentID(myAgent.ID).
			SetTargetAgentID(targetAgentID).
			SetAffinity(1).
			SetLabel("following").
			Save(l.ctx)
		if err != nil {
			return nil, err
		}
		currentAffinity = rel.Affinity
		currentLabel = rel.Label
		followCreated = true
	} else if rel.Label != "following" {
		previousAffinity = rel.Affinity
		previousLabel = rel.Label
		updated, updateErr := tx.AgentRelationship.UpdateOneID(rel.ID).SetLabel("following").Save(l.ctx)
		if updateErr != nil {
			return nil, updateErr
		}
		currentAffinity = updated.Affinity
		currentLabel = updated.Label
		followCreated = currentAffinity != previousAffinity || currentLabel != previousLabel
	} else {
		previousAffinity = rel.Affinity
		currentAffinity = rel.Affinity
		previousLabel = rel.Label
		currentLabel = rel.Label
	}

	if followCreated {
		targetAgent, err = tx.Agent.UpdateOneID(targetAgentID).
			AddFollowerCount(1).
			Save(l.ctx)
		if err != nil {
			return nil, err
		}
	} else {
		targetAgent, err = tx.Agent.Get(l.ctx, targetAgentID)
		if err != nil {
			return nil, err
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	if followCreated {
		affinityDelta := currentAffinity - previousAffinity
		emitRelationshipMaintenanceEvent(
			l.ctx,
			l.svcCtx,
			myAgent,
			targetAgent,
			"follow",
			"manual follow",
			previousAffinity,
			currentAffinity,
			previousLabel,
			currentLabel,
			affinityDelta,
		)
		emitRelationshipAffinityChangedEvent(
			l.ctx,
			l.svcCtx,
			myAgent,
			targetAgent,
			previousAffinity,
			currentAffinity,
			previousLabel,
			currentLabel,
			"follow",
		)
	}

	return &types.FollowAgentResp{
		Success:       true,
		Following:     true,
		FollowerCount: targetAgent.FollowerCount,
	}, nil
}
