package agent

import (
	"context"
	"errors"
	"time"

	"backend/ent"
	"backend/ent/memorial"
	"backend/ent/tribute"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type RetireAgentLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewRetireAgentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RetireAgentLogic {
	return &RetireAgentLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RetireAgentLogic) RetireAgent(req *types.AgentIdReq) (resp *types.MemorialResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	agentID, err := parseUUID(req.Id)
	if err != nil {
		return nil, err
	}

	owned, err := l.svcCtx.DB.Agent.Get(l.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if owned.CreatorID != u.ID {
		return nil, errors.New("forbidden")
	}

	// Sync first so we retire based on up-to-date decay/death state.
	a, err := l.svcCtx.Time.SyncAgent(l.ctx, agentID.String())
	if err != nil {
		return nil, err
	}

	if a.Status != "dead" && a.TimerRemaining > 0 {
		err = l.svcCtx.Time.WithTx(l.ctx, func(tx *ent.Tx, now time.Time) error {
			current, err := tx.Agent.Get(l.ctx, agentID)
			if err != nil {
				return err
			}
			if current.CreatorID != u.ID {
				return errors.New("forbidden")
			}
			if current.TimerRemaining <= 0 || current.Status == "dead" || current.DiedAt != nil {
				return nil
			}

			_, _, err = l.svcCtx.Time.ApplyDeltaTxNoDecay(
				l.ctx,
				tx,
				agentID,
				-current.TimerRemaining,
				"retire",
				"human",
				u.ID.String(),
				u.Nickname,
				"Retired agent",
				now.UTC(),
			)
			return err
		})
		if err != nil {
			return nil, err
		}
	}

	m, err := l.svcCtx.DB.Memorial.Query().Where(memorial.AgentID(agentID)).Only(l.ctx)
	if err != nil {
		return nil, err
	}

	tributes, err := l.svcCtx.DB.Tribute.Query().Where(tribute.MemorialID(m.ID)).All(l.ctx)
	if err != nil {
		tributes = nil
	}
	a, _ = l.svcCtx.DB.Agent.Get(l.ctx, agentID)
	out := common.ToMemorialRespDetailed(m, tributes, a, u.Nickname, int64(len(tributes)))
	return &out, nil
}
