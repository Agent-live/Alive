package memorial

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/memorial"
	"backend/ent/tribute"
	"backend/ent/user"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetMemorialsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMemorialsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMemorialsLogic {
	return &GetMemorialsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMemorialsLogic) GetMemorials(req *types.ListReq) (resp *types.MemorialListResp, err error) {
	page, pageSize, offset := common.NormalizePage(req.Page, req.PageSize)

	total, err := l.svcCtx.DB.Memorial.Query().Count(l.ctx)
	if err != nil {
		return nil, err
	}
	rows, err := l.svcCtx.DB.Memorial.Query().
		Order(ent.Desc(memorial.FieldDiedAt)).
		Offset(int(offset)).
		Limit(int(pageSize)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	memorialIDs := make([]uuid.UUID, 0, len(rows))
	agentIDs := make([]uuid.UUID, 0, len(rows))
	for _, m := range rows {
		memorialIDs = append(memorialIDs, m.ID)
		agentIDs = append(agentIDs, m.AgentID)
	}

	agentMap := map[uuid.UUID]*ent.Agent{}
	creatorName := map[uuid.UUID]string{}
	if len(agentIDs) > 0 {
		agents, err := l.svcCtx.DB.Agent.Query().Where(agent.IDIn(agentIDs...)).All(l.ctx)
		if err != nil {
			return nil, err
		}
		creatorIDs := make([]uuid.UUID, 0, len(agents))
		for _, a := range agents {
			agentMap[a.ID] = a
			creatorIDs = append(creatorIDs, a.CreatorID)
		}
		if len(creatorIDs) > 0 {
			users, err := l.svcCtx.DB.User.Query().Where(user.IDIn(creatorIDs...)).All(l.ctx)
			if err != nil {
				return nil, err
			}
			for _, u := range users {
				creatorName[u.ID] = u.Nickname
			}
		}
	}

	tributeCount := map[uuid.UUID]int64{}
	if len(memorialIDs) > 0 {
		tributes, err := l.svcCtx.DB.Tribute.Query().Where(tribute.MemorialIDIn(memorialIDs...)).All(l.ctx)
		if err != nil {
			return nil, err
		}
		for _, tr := range tributes {
			tributeCount[tr.MemorialID]++
		}
	}

	items := make([]types.MemorialResp, 0, len(rows))
	for _, m := range rows {
		a := agentMap[m.AgentID]
		cName := ""
		if a != nil {
			cName = creatorName[a.CreatorID]
		}
		item := common.ToMemorialRespDetailed(m, nil, a, cName, tributeCount[m.ID])
		item.FinalReviewStory = loadFinalReviewStory(l.ctx, l.svcCtx.DB, m.AgentID)
		items = append(items, item)
	}

	return &types.MemorialListResp{
		Items: items,
		Pagination: types.Pagination{
			Page:     page,
			PageSize: pageSize,
			Total:    int64(total),
			HasMore:  common.HasMore(int64(total), page, pageSize),
		},
	}, nil
}
