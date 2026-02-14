package user

import (
	"context"

	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetStatsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetStatsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetStatsLogic {
	return &GetStatsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetStatsLogic) GetStats() (resp *types.UserStatsResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	return &types.UserStatsResp{
		AgentsCreated:    int64(u.AgentsCreated),
		AgentsLost:       int64(u.AgentsLost),
		TotalTimerGiven:  u.TotalTimerGiven,
		DailyLoginStreak: int64(u.DailyLoginStreak),
	}, nil
}
