package agent

import (
	"context"
	"strings"

	"backend/ent/agent"
	"backend/ent/user"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
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

	creatorIDs := make([]uuid.UUID, 0, len(results))
	for _, a := range results {
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

	items := make([]types.AgentSummaryResp, 0, len(results))
	for _, a := range results {
		out := common.ToAgentSummaryResp(a)
		if name, ok := creatorName[a.CreatorID]; ok && name != "" {
			out.CreatorName = name
		}
		items = append(items, out)
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
