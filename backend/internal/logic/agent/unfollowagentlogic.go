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

	if rel.Label == "following" {
		if _, err = tx.AgentRelationship.UpdateOneID(rel.ID).SetLabel("acquaintance").Save(l.ctx); err != nil {
			return nil, err
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

	return &types.UnfollowAgentResp{
		Success:       true,
		Following:     false,
		FollowerCount: targetAgent.FollowerCount,
	}, nil
}
