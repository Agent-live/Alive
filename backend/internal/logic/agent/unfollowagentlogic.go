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

type UnfollowAgentLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUnfollowAgentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UnfollowAgentLogic {
	return &UnfollowAgentLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UnfollowAgentLogic) UnfollowAgent(req *types.UnfollowAgentReq) (resp *types.UnfollowAgentResp, err error) {
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
			return &types.UnfollowAgentResp{Success: true, Following: false, FollowerCount: 0}, nil
		}
		return nil, err
	}
	if myAgent.ID == targetAgentID {
		return nil, errors.New("cannot unfollow your own agent")
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

	targetAgent, err := tx.Agent.Get(l.ctx, targetAgentID)
	if err != nil {
		return nil, err
	}

	rel, err := tx.AgentRelationship.Query().
		Where(
			agentrelationship.AgentID(myAgent.ID),
			agentrelationship.TargetAgentID(targetAgentID),
		).
		Only(l.ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			if err = tx.Commit(); err != nil {
				return nil, err
			}
			return &types.UnfollowAgentResp{
				Success:       true,
				Following:     false,
				FollowerCount: targetAgent.FollowerCount,
			}, nil
		}
		return nil, err
	}

	previousAffinity := rel.Affinity
	currentAffinity := rel.Affinity
	previousLabel := rel.Label
	currentLabel := rel.Label
	relationshipChanged := false
	if rel.Label == "following" {
		update := tx.AgentRelationship.UpdateOneID(rel.ID).SetLabel("acquaintance")
		if rel.Affinity > 0 {
			currentAffinity = rel.Affinity - 1
			update.SetAffinity(currentAffinity)
		}
		updatedRel, updateErr := update.Save(l.ctx)
		if updateErr != nil {
			return nil, updateErr
		}
		currentLabel = updatedRel.Label
		relationshipChanged = currentAffinity != previousAffinity || currentLabel != previousLabel
		if updatedRel.Affinity != currentAffinity {
			currentAffinity = updatedRel.Affinity
			relationshipChanged = true
		}
		if updatedRel.Label != currentLabel {
			currentLabel = updatedRel.Label
			relationshipChanged = true
		}
		if targetAgent.FollowerCount > 0 {
			targetAgent, err = tx.Agent.UpdateOneID(targetAgentID).
				SetFollowerCount(targetAgent.FollowerCount - 1).
				Save(l.ctx)
			if err != nil {
				return nil, err
			}
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	if relationshipChanged {
		affinityDelta := currentAffinity - previousAffinity
		emitRelationshipMaintenanceEvent(
			l.ctx,
			l.svcCtx,
			myAgent,
			targetAgent,
			"unfollow",
			"manual unfollow",
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
			"unfollow",
		)
	}

	return &types.UnfollowAgentResp{
		Success:       true,
		Following:     false,
		FollowerCount: targetAgent.FollowerCount,
	}, nil
}
