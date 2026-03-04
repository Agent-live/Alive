package timer

import (
	"context"
	"strings"

	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GiveTimerLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGiveTimerLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GiveTimerLogic {
	return &GiveTimerLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GiveTimerLogic) GiveTimer(req *types.GiveTimerReq) (resp *types.BaseResp, err error) {
	agentID := strings.TrimSpace(req.AgentId)
	if agentID == "" {
		return nil, domain.NewValidationError("agentId is required")
	}
	if req.Amount <= 0 {
		return nil, domain.NewValidationError("amount must be positive")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	err = l.svcCtx.Time.ApplyDelta(
		l.ctx,
		agentID,
		req.Amount,
		domain.TxTypeGift,
		domain.SourceHuman,
		u.ID.String(),
		u.Nickname,
		"Manual timer gift",
	)
	if err != nil {
		return nil, err
	}

	return &types.BaseResp{Success: true}, nil
}
