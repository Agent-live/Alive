package memorial

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/memorial"
	"backend/ent/tribute"
	"backend/ent/user"
	"backend/internal/domain"
	"backend/internal/mapper"
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

	// Aggregate total lifespan using SQL SUM instead of loading all rows
	var lifespanAgg []struct {
		Sum int64 `json:"sum"`
	}
	err = l.svcCtx.DB.Memorial.Query().
		Aggregate(ent.Sum(memorial.FieldLifespanHours)).
		Scan(l.ctx, &lifespanAgg)
	if err != nil {
		return nil, err
	}
	totalLifespan := int64(0)
	if len(lifespanAgg) > 0 {
		totalLifespan = lifespanAgg[0].Sum
	}

	// Longest lived: single row ordered by lifespan DESC
	longestRow, err := l.svcCtx.DB.Memorial.Query().
		Order(ent.Desc(memorial.FieldLifespanHours)).
		First(l.ctx)
	if err != nil {
		return nil, err
	}

	// Most mourned: GROUP BY memorial_id on tributes, ordered by count DESC
	type memorialCount struct {
		MemorialID uuid.UUID `json:"memorial_id"`
		Count      int       `json:"count"`
	}
	var tributeAgg []memorialCount
	err = l.svcCtx.DB.Tribute.Query().
		GroupBy(tribute.FieldMemorialID).
		Aggregate(ent.Count()).
		Scan(l.ctx, &tributeAgg)
	if err != nil {
		return nil, err
	}
	tributeCount := make(map[uuid.UUID]int64, len(tributeAgg))
	var mostMournedMemorialID uuid.UUID
	var mostMournedValue int64
	for _, tc := range tributeAgg {
		tributeCount[tc.MemorialID] = int64(tc.Count)
		if int64(tc.Count) > mostMournedValue {
			mostMournedValue = int64(tc.Count)
			mostMournedMemorialID = tc.MemorialID
		}
	}

	// Look up the most mourned memorial name
	mostMournedName := ""
	if mostMournedValue > 0 {
		mm, err := l.svcCtx.DB.Memorial.Get(l.ctx, mostMournedMemorialID)
		if err == nil {
			mostMournedName = mm.AgentName
		}
	}
	if mostMournedName == "" {
		// Fallback: use the first memorial
		first, err := l.svcCtx.DB.Memorial.Query().First(l.ctx)
		if err == nil {
			mostMournedName = first.AgentName
		}
	}

	// Recent deaths (limited to 5)
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
		totalTimerReceivedSecs := int64(0)
		if a != nil {
			cName = creatorName[a.CreatorID]
			totalTimerReceivedSecs = a.TotalTimerReceived * int64(domain.TimerUnitDuration.Seconds())
		}
		item := mapper.ToMemorialRespDetailed(row, nil, a, cName, tributeCount[row.ID], totalTimerReceivedSecs)
		item.FinalReviewStory = loadFinalReviewStory(l.ctx, l.svcCtx.DB, row.AgentID)
		recent = append(recent, item)
	}

	return &types.MemorialStatsResp{
		TotalDeaths:     int64(total),
		AverageLifespan: totalLifespan / int64(total),
		LongestLived: types.MemorialTopRef{
			AgentName: longestRow.AgentName,
			Value:     longestRow.LifespanHours,
		},
		MostMourned: types.MemorialTopRef{
			AgentName: mostMournedName,
			Value:     mostMournedValue,
		},
		RecentDeaths: recent,
	}, nil
}
