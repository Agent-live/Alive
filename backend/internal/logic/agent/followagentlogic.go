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
		followCreated = true
	} else if rel.Label != "following" {
		if _, err = tx.AgentRelationship.UpdateOneID(rel.ID).SetLabel("following").Save(l.ctx); err != nil {
			return nil, err
		}
		followCreated = true
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

	return &types.FollowAgentResp{
		Success:       true,
		Following:     true,
		FollowerCount: targetAgent.FollowerCount,
	}, nil
}
