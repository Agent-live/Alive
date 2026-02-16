package agent

import (
	"context"

	"backend/ent"
	"backend/ent/user"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetAgentListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetAgentListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAgentListLogic {
	return &GetAgentListLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetAgentListLogic) GetAgentList(req *types.ListReq) (resp *types.AgentListResp, err error) {
	page, pageSize, offset := common.NormalizePage(req.Page, req.PageSize)

	total, err := l.svcCtx.DB.Agent.Query().Count(l.ctx)
	if err != nil {
		return nil, err
	}

	items, err := l.svcCtx.DB.Agent.Query().
		Order(ent.Desc("created_at")).
		Offset(int(offset)).
		Limit(int(pageSize)).
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
			Page:     page,
			PageSize: pageSize,
			Total:    int64(total),
			HasMore:  common.HasMore(int64(total), page, pageSize),
		},
	}, nil
}
