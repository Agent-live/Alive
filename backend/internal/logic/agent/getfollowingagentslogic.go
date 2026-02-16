package agent

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agentrelationship"
	"backend/ent/user"
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

	myAgent, err := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).Only(l.ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return &types.FollowingListResp{Items: []types.AgentSummaryResp{}}, nil
		}
		return nil, err
	}

	relations, err := l.svcCtx.DB.AgentRelationship.Query().
		Where(
			agentrelationship.AgentID(myAgent.ID),
			agentrelationship.LabelEQ("following"),
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
	targetByID := make(map[uuid.UUID]*ent.Agent, len(targetAgents))
	creatorIDs := make([]uuid.UUID, 0, len(targetAgents))
	for _, a := range targetAgents {
		targetByID[a.ID] = a
		creatorIDs = append(creatorIDs, a.CreatorID)
	}

	creatorName := map[uuid.UUID]string{}
	if len(creatorIDs) > 0 {
		users, err := l.svcCtx.DB.User.Query().Where(user.IDIn(creatorIDs...)).All(l.ctx)
		if err != nil {
			return nil, err
		}
		for _, item := range users {
			creatorName[item.ID] = item.Nickname
		}
	}

	items := make([]types.AgentSummaryResp, 0, len(relations))
	for _, rel := range relations {
		a, ok := targetByID[rel.TargetAgentID]
		if !ok {
			continue
		}
		out := common.ToAgentSummaryResp(a)
		if name, ok := creatorName[a.CreatorID]; ok && name != "" {
			out.CreatorName = name
		}
		items = append(items, out)
	}

	return &types.FollowingListResp{Items: items}, nil
}
