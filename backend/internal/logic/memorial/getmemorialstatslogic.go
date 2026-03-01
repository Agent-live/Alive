package memorial

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/memorial"
	"backend/ent/user"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetMemorialStatsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMemorialStatsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMemorialStatsLogic {
	return &GetMemorialStatsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMemorialStatsLogic) GetMemorialStats() (resp *types.MemorialStatsResp, err error) {
	total, err := l.svcCtx.DB.Memorial.Query().Count(l.ctx)
	if err != nil {
		return nil, err
	}
	if total == 0 {
		return &types.MemorialStatsResp{
			TotalDeaths:     0,
			AverageLifespan: 0,
			LongestLived:    types.MemorialTopRef{},
			MostMourned:     types.MemorialTopRef{},
			RecentDeaths:    []types.MemorialResp{},
		}, nil
	}

	allRows, err := l.svcCtx.DB.Memorial.Query().All(l.ctx)
	if err != nil {
		return nil, err
	}

	tributeRows, err := l.svcCtx.DB.Tribute.Query().All(l.ctx)
	if err != nil {
		return nil, err
	}
	tributeCount := make(map[uuid.UUID]int64, len(tributeRows))
	for _, tr := range tributeRows {
		tributeCount[tr.MemorialID]++
	}

	var totalLifespan int64
	var longestName string
	var longestValue int64
	var mostMournedName string
	var mostMournedValue int64

	for _, row := range allRows {
		totalLifespan += row.LifespanHours
		if row.LifespanHours > longestValue {
			longestValue = row.LifespanHours
			longestName = row.AgentName
		}

		if tributeCount[row.ID] > mostMournedValue {
			mostMournedValue = tributeCount[row.ID]
			mostMournedName = row.AgentName
		}
	}

	recentRows, err := l.svcCtx.DB.Memorial.Query().
		Order(ent.Desc(memorial.FieldDiedAt)).
		Limit(5).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	agentIDs := make([]uuid.UUID, 0, len(recentRows))
	for _, row := range recentRows {
		agentIDs = append(agentIDs, row.AgentID)
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

	recent := make([]types.MemorialResp, 0, len(recentRows))
	for _, row := range recentRows {
		a := agentMap[row.AgentID]
		cName := ""
		if a != nil {
			cName = creatorName[a.CreatorID]
		}
		item := common.ToMemorialRespDetailed(row, nil, a, cName, tributeCount[row.ID])
		item.FinalReviewStory = loadFinalReviewStory(l.ctx, l.svcCtx.DB, row.AgentID)
		recent = append(recent, item)
	}

	if mostMournedName == "" && len(allRows) > 0 {
		mostMournedName = allRows[0].AgentName
	}

	return &types.MemorialStatsResp{
		TotalDeaths:     int64(total),
		AverageLifespan: totalLifespan / int64(total),
		LongestLived: types.MemorialTopRef{
			AgentName: longestName,
			Value:     longestValue,
		},
		MostMourned: types.MemorialTopRef{
			AgentName: mostMournedName,
			Value:     mostMournedValue,
		},
		RecentDeaths: recent,
	}, nil
}
