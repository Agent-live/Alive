package skill

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/ent"
	"backend/internal/aliveagent"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeactivateSkillLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeactivateSkillLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeactivateSkillLogic {
	return &DeactivateSkillLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeactivateSkillLogic) DeactivateSkill(req *types.SkillIdReq) (resp *types.SkillResp, err error) {
	skillID, err := parseSkillID(req.Id)
	if err != nil {
		return nil, err
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	row, err := l.svcCtx.DB.AgentSkill.Get(l.ctx, skillID)
	if err != nil {
		return nil, err
	}
	if row.OwnerUserID != u.ID {
		return nil, errors.New("forbidden")
	}

	var (
		targetAgentID    string
		targetRuntimeID  string
		targetAgentName  string
		aliveAgentSkill  string
		deactivateReason = "manual_deactivate"
	)
	if row.AgentID != nil {
		targetAgentID = row.AgentID.String()
		aliveAgentSkill = strings.TrimSpace(common.PtrString(row.AliveAgentSkillID))
		target, getErr := l.svcCtx.DB.Agent.Get(l.ctx, *row.AgentID)
		if getErr == nil {
			targetRuntimeID = strings.TrimSpace(common.PtrString(target.AliveAgentRuntimeID))
			targetAgentName = strings.TrimSpace(target.Name)
		} else if !ent.IsNotFound(getErr) {
			l.Logger.Errorf("load target agent for deactivate failed: %v", getErr)
		}
	}

	// Best-effort: remove the bound workspace skill so AliveAgent stops loading it.
	if row.AgentID != nil && row.Status == "active" {
		skillRef := row.Name
		if row.AliveAgentSkillID != nil && strings.TrimSpace(*row.AliveAgentSkillID) != "" {
			skillRef = *row.AliveAgentSkillID
		}
		_ = l.svcCtx.AliveAgent.RemoveSkill(l.ctx, row.AgentID.String(), skillRef)
	}

	row, err = l.svcCtx.DB.AgentSkill.UpdateOneID(skillID).
		SetStatus("lesson").
		ClearAgentID().
		ClearTaughtAt().
		ClearAliveAgentGatewayID().
		ClearAliveAgentSkillID().
		Save(l.ctx)
	if err != nil {
		return nil, err
	}
	if targetRuntimeID != "" && l.svcCtx.AliveAgent != nil {
		_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
			RuntimeAgentID: targetRuntimeID,
			AgentID:        targetAgentID,
			EventType:      "skill.deactivated",
			Title:          "ALIVE Skill Deactivated",
			Message:        fmt.Sprintf("Skill deactivated: %s", row.Name),
			DedupeKey:      aliveagent.BuildDedupeKey(targetAgentID, "skill.deactivated", row.ID.String(), deactivateReason),
			Payload: map[string]any{
				"skillId":           row.ID.String(),
				"skillName":         row.Name,
				"targetAgentId":     targetAgentID,
				"targetAgentName":   targetAgentName,
				"aliveAgentSkillId": aliveAgentSkill,
				"reason":            deactivateReason,
			},
			TimeoutSeconds: 120,
		})
	}
	out := common.ToSkillResp(row, nil)
	return &out, nil
}
