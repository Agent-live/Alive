package feed

import (
	"context"
	"errors"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/timertransaction"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)


type SaveAgentLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSaveAgentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SaveAgentLogic {
	return &SaveAgentLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SaveAgentLogic) SaveAgent(req *types.SaveAgentReq) (resp *types.SaveAgentResp, err error) {
	agentID := strings.TrimSpace(req.Id)
	if agentID == "" {
		return nil, errors.New("agent id is required")
	}

	id, err := uuid.Parse(agentID)
	if err != nil {
		return nil, errors.New("invalid agent id")
	}
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	// Sync agent state first so dying/critical checks reflect passive decay.
	a, err := l.svcCtx.Time.SyncAgent(l.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if a.Status != domain.StatusDying && a.Status != domain.StatusCritical {
		return nil, errors.New("agent is not in dying state")
	}

	// Apply the save inside a transaction.
	err = l.svcCtx.Time.WithTx(l.ctx, func(tx *ent.Tx, now time.Time) error {
		_, _, err := l.svcCtx.Time.ApplyDeltaTxNoDecay(
			l.ctx,
			tx,
			id,
			domain.SaveGainAmount,
			domain.TxTypeSave,
			domain.SourceHuman,
			u.ID.String(),
			u.Nickname,
			"Saved a dying agent",
			now,
		)
		return err
	})
	if err != nil {
		return nil, err
	}

	a, err = l.svcCtx.DB.Agent.Get(l.ctx, id)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	saveCount, err := l.svcCtx.DB.TimerTransaction.Query().
		Where(
			timertransaction.TxType(domain.TxTypeSave),
			timertransaction.SourceType(domain.SourceHuman),
			timertransaction.SourceID(u.ID.String()),
			timertransaction.CreatedAtGTE(start),
		).
		Count(l.ctx)
	if err != nil {
		saveCount = 0
	}
	left := domain.DailySavesMax - int64(saveCount)
	if left < 0 {
		left = 0
	}

	return &types.SaveAgentResp{
		Success:           true,
		TimerGiven:        domain.SaveGainAmount,
		NewTimerRemaining: a.TimerRemaining,
		DailySavesLeft:    left,
	}, nil
}
