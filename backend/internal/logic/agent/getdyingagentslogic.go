package agent

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/user"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
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
		Where(agent.StatusIn("dying", "critical")).
		Order(ent.Asc(agent.FieldTimerRemaining)).
		Limit(100).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	creatorIDs := make([]uuid.UUID, 0, len(items))
	for _, a := range items {
		creatorIDs = append(creatorIDs, a.CreatorID)
	}
	creatorName := map[uuid.UUID]string{}
	if len(creatorIDs) > 0 {
		users, err := l.svcCtx.DB.User.Query().Where(user.IDIn(creatorIDs...)).All(l.ctx)
		if err != nil {
			return nil, err
		}
		for _, u := range users {
			creatorName[u.ID] = u.Nickname
		}
	}

	list := make([]types.AgentSummaryResp, 0, len(items))
	for _, it := range items {
		out := common.ToAgentSummaryResp(it)
		if name, ok := creatorName[it.CreatorID]; ok && name != "" {
			out.CreatorName = name
		}
		list = append(list, out)
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
