package timer

import (
	"context"
	"time"

	"backend/ent/timertransaction"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/service/timeengine"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetDailyBudgetLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetDailyBudgetLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetDailyBudgetLogic {
	return &GetDailyBudgetLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetDailyBudgetLogic) GetDailyBudget() (resp *types.DailyBudgetResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	budget := timeengine.DailyTimerBudget

	usedRows, err := l.svcCtx.DB.TimerTransaction.Query().
		Where(
			timertransaction.SourceType(domain.SourceHuman),
			timertransaction.SourceID(u.ID.String()),
			timertransaction.CreatedAtGTE(start),
			timertransaction.TxTypeIn(domain.TxTypeLike, domain.TxTypeReply, domain.TxTypeShare, domain.TxTypeSave, domain.TxTypeGift),
		).All(l.ctx)
	if err != nil {
		usedRows = nil
	}
	used := int64(0)
	likesUsed := int64(0)
	repliesUsed := int64(0)
	sharesUsed := int64(0)
	savesUsed := int64(0)
	for _, row := range usedRows {
		if row.Amount > 0 {
			used += row.Amount
		}
		switch row.TxType {
		case domain.TxTypeLike:
			likesUsed++
		case domain.TxTypeReply:
			repliesUsed++
		case domain.TxTypeShare:
			sharesUsed++
		case domain.TxTypeSave:
			savesUsed++
		}
	}

	bonusCount, err := l.svcCtx.DB.TimerTransaction.Query().
		Where(
			timertransaction.TxType(domain.TxTypeLoginBonus),
			timertransaction.SourceID(u.ID.String()),
			timertransaction.CreatedAtGTE(start),
		).Count(l.ctx)
	if err != nil {
		return nil, err
	}

	remaining := budget - used
	if remaining < 0 {
		remaining = 0
	}

	return &types.DailyBudgetResp{
		DailyTimerBudget: budget,
		UsedTimer:        used,
		RemainingTimer:   remaining,
		BonusClaimed:     bonusCount > 0,
		LikesUsed:        likesUsed,
		LikesMax:         timeengine.DailyLikesMax,
		RepliesUsed:      repliesUsed,
		RepliesMax:       timeengine.DailyRepliesMax,
		SharesUsed:       sharesUsed,
		SharesMax:        timeengine.DailySharesMax,
		SavesUsed:        savesUsed,
		SavesMax:         timeengine.DailySavesMax,
		Date:             now.Format("2006-01-02"),
	}, nil
}
