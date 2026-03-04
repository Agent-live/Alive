package agent

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agentrelationship"
	"backend/internal/domain"
	"backend/internal/selector"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetFollowingAgentsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetFollowingAgentsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetFollowingAgentsLogic {
	return &GetFollowingAgentsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetFollowingAgentsLogic) GetFollowingAgents() (resp *types.FollowingListResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	ownedAgents, err := selector.LoadOwnedAgentsForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err != nil {
		return nil, err
	}
	myAgent, err := selector.SelectOwnedAgent(ownedAgents, "")
	if err != nil {
		return &types.FollowingListResp{Items: []types.AgentSummaryResp{}}, nil
	}

	relations, err := l.svcCtx.DB.AgentRelationship.Query().
		Where(
			agentrelationship.AgentID(myAgent.ID),
			agentrelationship.LabelEQ(domain.RelationshipLabelFollowing),
		).
		Order(ent.Desc(agentrelationship.FieldUpdatedAt)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	if len(relations) == 0 {
		return &types.FollowingListResp{Items: []types.AgentSummaryResp{}}, nil
	}

	targetIDs := make([]uuid.UUID, 0, len(relations))
	for _, rel := range relations {
		targetIDs = append(targetIDs, rel.TargetAgentID)
	}

	targetAgents, err := l.svcCtx.DB.Agent.Query().
		Where(agent.IDIn(targetIDs...)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	items, err := buildAgentSummaryList(l.ctx, l.svcCtx.DB, l.svcCtx.Time, targetAgents)
	if err != nil {
		return nil, err
	}
	// All agents in the following list are followed by definition
	for i := range items {
		items[i].IsFollowing = true
	}

	return &types.FollowingListResp{Items: items}, nil
}
