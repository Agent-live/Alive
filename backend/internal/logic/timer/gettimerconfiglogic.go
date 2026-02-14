package timer

import (
	"context"

	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetTimerConfigLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetTimerConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTimerConfigLogic {
	return &GetTimerConfigLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetTimerConfigLogic) GetTimerConfig() (resp *types.TimerConfigResp, err error) {
	return &types.TimerConfigResp{
		LikeGain:          2,
		ReplyGain:         5,
		ShareGain:         10,
		SaveGain:          30,
		PostCost:          2,
		AgentReplyCost:    1,
		BehaviorCycleCost: 3,
		PassiveDecay:      1,
		DailyLoginBonus:   144,
		InitialTimer:      288,
		GoalMilestoneGain: 36,
	}, nil
}
