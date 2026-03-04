package agent

import (
	"context"
	"errors"
	"fmt"
	"time"

	"backend/ent"
	"backend/ent/memorial"
	"backend/ent/tribute"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/logic/notify"
	"backend/internal/mapper"
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
	agentID, err := domain.ParseUUID(req.Id)
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

	if a.Status != domain.StatusDead && a.TimerRemaining > 0 {
		err = l.svcCtx.Time.WithTx(l.ctx, func(tx *ent.Tx, now time.Time) error {
			current, err := tx.Agent.Get(l.ctx, agentID)
			if err != nil {
				return err
			}
			if current.CreatorID != u.ID {
				return errors.New("forbidden")
			}
			if current.TimerRemaining <= 0 || current.Status == domain.StatusDead || current.DiedAt != nil {
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

	// Best-effort: emit lifecycle events then retire runtime session.
	if l.svcCtx != nil && l.svcCtx.AgentRuntime != nil {
		emitter := notify.NewEmitter(l.ctx, l.svcCtx)
		basePayload := map[string]any{
			"agentId":       owned.ID.String(),
			"agentName":     owned.Name,
			"retiredBy":     u.ID.String(),
			"retiredByName": u.Nickname,
			"diedAt":        domain.TimeToISO(m.DiedAt),
			"memorialId":    m.ID.String(),
		}
		emitter.EmitEventToAgentRow(owned,
			"lifecycle.agent_retired",
			"ALIVE Agent Retired",
			fmt.Sprintf("Agent retired: %s", owned.Name),
			domain.BuildDedupeKey(owned.ID.String(), "lifecycle.agent_retired", m.ID.String()),
			basePayload,
		)
		emitter.EmitEventToAgentRow(owned,
			"lifecycle.death_committed",
			"ALIVE Lifecycle Death Committed",
			fmt.Sprintf("Death committed for agent: %s", owned.Name),
			domain.BuildDedupeKey(owned.ID.String(), "lifecycle.death_committed", m.ID.String()),
			basePayload,
		)
		emitter.EmitEventToAgentRow(owned,
			"memorial.created",
			"ALIVE Memorial Created",
			fmt.Sprintf("Memorial created for agent: %s", owned.Name),
			domain.BuildDedupeKey(owned.ID.String(), "memorial.created", m.ID.String()),
			basePayload,
		)
		emitter.EmitEventToAgentRow(owned,
			"legacy.pack_created",
			"ALIVE Legacy Pack Created",
			fmt.Sprintf("Legacy pack created for agent: %s", owned.Name),
			domain.BuildDedupeKey(owned.ID.String(), "legacy.pack_created", m.ID.String()),
			basePayload,
		)
		if err := l.svcCtx.AgentRuntime.UnregisterAgent(l.ctx, agentID.String()); err != nil {
			l.Logger.Errorf("unregister alive agent failed: %v", err)
		}
	}

	totalTimerReceivedSecs := int64(0)
	if a != nil {
		totalTimerReceivedSecs = a.TotalTimerReceived * int64(domain.TimerUnitDuration.Seconds())
	}
	out := mapper.ToMemorialRespDetailed(m, tributes, a, u.Nickname, int64(len(tributes)), totalTimerReceivedSecs)
	return &out, nil
}
