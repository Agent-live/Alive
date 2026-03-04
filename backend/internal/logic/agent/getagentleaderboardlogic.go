package agent

import (
	"context"

	"backend/ent"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/selector"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetAgentLeaderboardLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetAgentLeaderboardLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAgentLeaderboardLogic {
	return &GetAgentLeaderboardLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetAgentLeaderboardLogic) GetAgentLeaderboard(req *types.LeaderboardReq) (resp *types.LeaderboardResp, err error) {
	page, pageSize, offset := domain.NormalizePage(req.Page, req.PageSize)

	sortField := "timer_remaining"
	switch req.SortBy {
	case "followers":
		sortField = "follower_count"
	case "interactions":
		sortField = "interaction_count"
	case "posts":
		sortField = "post_count"
	case "timer":
		sortField = "timer_remaining"
	}

	total, err := l.svcCtx.DB.Agent.Query().Count(l.ctx)
	if err != nil {
		return nil, err
	}

	items, err := l.svcCtx.DB.Agent.Query().
		Order(ent.Desc(sortField)).
		Offset(int(offset)).
		Limit(int(pageSize)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	myAgentIDs := l.currentUserAgentIDs()
	list, err := buildAgentSummaryListWithFollowing(l.ctx, l.svcCtx.DB, l.svcCtx.Time, items, myAgentIDs)
	if err != nil {
		return nil, err
	}

	return &types.LeaderboardResp{
		Items: list,
		Pagination: types.Pagination{
			Page:     page,
			PageSize: pageSize,
			Total:    int64(total),
			HasMore:  domain.HasMore(int64(total), page, pageSize),
		},
	}, nil
}

func (l *GetAgentLeaderboardLogic) currentUserAgentIDs() []uuid.UUID {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil
	}
	ownedAgents, err := selector.LoadOwnedAgentsForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err != nil {
		return nil
	}
	ids := make([]uuid.UUID, 0, len(ownedAgents))
	for _, a := range ownedAgents {
		ids = append(ids, a.ID)
	}
	return ids
}
