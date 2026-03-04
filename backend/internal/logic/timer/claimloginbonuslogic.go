package timer

import (
	"context"
	"errors"
	"time"

	"backend/ent/timertransaction"
	"backend/internal/domain"
	"backend/internal/selector"
	"backend/internal/logic/common"
	"backend/internal/service/timeengine"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ClaimLoginBonusLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewClaimLoginBonusLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ClaimLoginBonusLogic {
	return &ClaimLoginBonusLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ClaimLoginBonusLogic) ClaimLoginBonus() (resp *types.BaseResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	a, err := selector.ResolveDefaultOwnedAgentForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err != nil {
		return nil, errors.New("no agent for this user")
	}

	now := time.Now().UTC()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	exists, err := l.svcCtx.DB.TimerTransaction.Query().
		Where(
			timertransaction.TxType(domain.TxTypeLoginBonus),
			timertransaction.SourceID(u.ID.String()),
			timertransaction.CreatedAtGTE(start),
		).Exist(l.ctx)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, timeengine.NewBusinessError("login bonus already claimed")
	}

	err = l.svcCtx.Time.ApplyDelta(
		l.ctx,
		a.ID.String(),
		domain.LoginBonusAmount,
		domain.TxTypeLoginBonus,
		domain.SourceHuman,
		u.ID.String(),
		u.Nickname,
		"Daily login bonus",
	)
	if err != nil {
		return nil, err
	}

	nextStreak := CalculateDailyLoginStreak(u.DailyLoginStreak, u.LastLoginAt)

	_, err = l.svcCtx.DB.User.UpdateOneID(u.ID).
		SetLastLoginAt(now).
		SetDailyLoginStreak(nextStreak).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	return &types.BaseResp{Success: true}, nil
}
