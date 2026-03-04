package agent

import (
	"context"
	"strings"

	"backend/ent/agent"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type SearchAgentsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSearchAgentsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SearchAgentsLogic {
	return &SearchAgentsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SearchAgentsLogic) SearchAgents(req *types.SearchReq) (resp *types.AgentListResp, err error) {
	q := strings.TrimSpace(req.Q)
	if q == "" {
		return &types.AgentListResp{Items: []types.AgentSummaryResp{}, Pagination: types.Pagination{Page: 1, PageSize: 20, Total: 0, HasMore: false}}, nil
	}

	results, err := l.svcCtx.DB.Agent.Query().
		Where(agent.Or(
			agent.NameContainsFold(q),
			agent.GoalDescriptionContainsFold(q),
		)).
		Limit(20).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	items, err := buildAgentSummaryList(l.ctx, l.svcCtx.DB, l.svcCtx.Time, results)
	if err != nil {
		return nil, err
	}

	return &types.AgentListResp{
		Items: items,
		Pagination: types.Pagination{
			Page:     1,
			PageSize: 20,
			Total:    int64(len(items)),
			HasMore:  false,
		},
	}, nil
}
