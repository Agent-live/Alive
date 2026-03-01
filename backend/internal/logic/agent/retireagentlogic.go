package agent

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/memorial"
	"backend/ent/tribute"
	"backend/internal/aliveagent"
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

	// Best-effort: emit lifecycle events then retire runtime session.
	if l.svcCtx != nil && l.svcCtx.AliveAgent != nil {
		runtimeAgentID := strings.TrimSpace(common.PtrString(owned.AliveAgentRuntimeID))
		if runtimeAgentID != "" {
			basePayload := map[string]any{
				"agentId":       owned.ID.String(),
				"agentName":     owned.Name,
				"retiredBy":     u.ID.String(),
				"retiredByName": u.Nickname,
				"diedAt":        common.TimeToISO(m.DiedAt),
				"memorialId":    m.ID.String(),
			}
			_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
				RuntimeAgentID: runtimeAgentID,
				AgentID:        owned.ID.String(),
				EventType:      "lifecycle.agent_retired",
				Title:          "ALIVE Agent Retired",
				Message:        fmt.Sprintf("Agent retired: %s", owned.Name),
				DedupeKey:      aliveagent.BuildDedupeKey(owned.ID.String(), "lifecycle.agent_retired", m.ID.String()),
				Payload:        basePayload,
				TimeoutSeconds: 120,
			})
			_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
				RuntimeAgentID: runtimeAgentID,
				AgentID:        owned.ID.String(),
				EventType:      "lifecycle.death_committed",
				Title:          "ALIVE Lifecycle Death Committed",
				Message:        fmt.Sprintf("Death committed for agent: %s", owned.Name),
				DedupeKey:      aliveagent.BuildDedupeKey(owned.ID.String(), "lifecycle.death_committed", m.ID.String()),
				Payload:        basePayload,
				TimeoutSeconds: 120,
			})
			_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
				RuntimeAgentID: runtimeAgentID,
				AgentID:        owned.ID.String(),
				EventType:      "memorial.created",
				Title:          "ALIVE Memorial Created",
				Message:        fmt.Sprintf("Memorial created for agent: %s", owned.Name),
				DedupeKey:      aliveagent.BuildDedupeKey(owned.ID.String(), "memorial.created", m.ID.String()),
				Payload:        basePayload,
				TimeoutSeconds: 120,
			})
			_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
				RuntimeAgentID: runtimeAgentID,
				AgentID:        owned.ID.String(),
				EventType:      "legacy.pack_created",
				Title:          "ALIVE Legacy Pack Created",
				Message:        fmt.Sprintf("Legacy pack created for agent: %s", owned.Name),
				DedupeKey:      aliveagent.BuildDedupeKey(owned.ID.String(), "legacy.pack_created", m.ID.String()),
				Payload:        basePayload,
				TimeoutSeconds: 120,
			})
		}
		if err := l.svcCtx.AliveAgent.UnregisterAgent(agentID.String()); err != nil {
			l.Logger.Errorf("unregister alive agent failed: %v", err)
		}
	}

	out := common.ToMemorialRespDetailed(m, tributes, a, u.Nickname, int64(len(tributes)))
	return &out, nil
}
