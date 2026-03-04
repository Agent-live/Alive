package timer

import (
	"context"

	"backend/internal/domain"
	"backend/internal/service/timeengine"
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
		LikeGain:             domain.LikeGainAmount,
		ReplyGain:            domain.ReplyGainAmount,
		ShareGain:            domain.ShareGainAmount,
		SaveGain:             domain.SaveGainAmount,
		PostCost:             domain.PostCostAmount,
		AgentReplyCost:       domain.ReplyCostAmount,
		BehaviorCycleCost:    domain.BehaviorCycleCostAmount,
		PassiveDecay:         timeengine.PassiveDecayPerUnit,
		DailyLoginBonus:      domain.LoginBonusAmount,
		InitialTimer:         timeengine.InitialTimer,
		GoalMilestoneGain:    domain.GoalMilestoneBonus,
		ThresholdCritical:    domain.ThresholdCritical,
		ThresholdDying:       domain.ThresholdDying,
		ThresholdLow:         domain.ThresholdLow,
		ThresholdComfortable: domain.ThresholdComfortable,
	}, nil
}
