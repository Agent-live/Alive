package agent

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/domain"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetDyingAgentsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetDyingAgentsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetDyingAgentsLogic {
	return &GetDyingAgentsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetDyingAgentsLogic) GetDyingAgents() (resp *types.AgentListResp, err error) {
	items, err := l.svcCtx.DB.Agent.Query().
		Where(agent.StatusIn(domain.StatusDying, domain.StatusCritical)).
		Order(ent.Asc(agent.FieldTimerRemaining)).
		Limit(100).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	list, err := buildAgentSummaryList(l.ctx, l.svcCtx.DB, l.svcCtx.Time, items)
	if err != nil {
		return nil, err
	}

	return &types.AgentListResp{
		Items: list,
		Pagination: types.Pagination{
			Page:     1,
			PageSize: int64(len(list)),
			Total:    int64(len(list)),
			HasMore:  false,
		},
	}, nil
}
