package skill

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/ent"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/logic/notify"
	"backend/internal/mapper"
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
		aliveAgentSkill = strings.TrimSpace(domain.PtrString(row.AliveAgentSkillID))
		target, getErr := l.svcCtx.DB.Agent.Get(l.ctx, *row.AgentID)
		if getErr == nil {
			targetRuntimeID = strings.TrimSpace(domain.PtrString(target.AliveAgentRuntimeID))
			targetAgentName = strings.TrimSpace(target.Name)
		} else if !ent.IsNotFound(getErr) {
			l.Logger.Errorf("load target agent for deactivate failed: %v", getErr)
		}
	}

	// Best-effort: remove the bound workspace skill so AliveAgent stops loading it.
	if row.AgentID != nil && row.Status == domain.SkillStatusActive {
		skillRef := row.Name
		if row.AliveAgentSkillID != nil && strings.TrimSpace(*row.AliveAgentSkillID) != "" {
			skillRef = *row.AliveAgentSkillID
		}
		if l.svcCtx.AgentRuntime == nil {
			return nil, errors.New("agent runtime is not available")
		}
		if err := l.svcCtx.AgentRuntime.RemoveSkill(l.ctx, row.AgentID.String(), skillRef); err != nil {
			return nil, err
		}
	}

	row, err = l.svcCtx.DB.AgentSkill.UpdateOneID(skillID).
		SetStatus(domain.SkillStatusLesson).
		ClearAgentID().
		ClearTaughtAt().
		ClearAliveAgentGatewayID().
		ClearAliveAgentSkillID().
		Save(l.ctx)
	if err != nil {
		return nil, err
	}
	notify.NewEmitter(l.ctx, l.svcCtx).EmitEventToAgentIDWithRuntimeID(
		targetAgentID, targetRuntimeID,
		domain.EventSkillDeactivated,
		"ALIVE Skill Deactivated",
		fmt.Sprintf("Skill deactivated: %s", row.Name),
		domain.BuildDedupeKey(targetAgentID, domain.EventSkillDeactivated, row.ID.String(), deactivateReason),
		map[string]any{
			"skillId":           row.ID.String(),
			"skillName":         row.Name,
			"targetAgentId":     targetAgentID,
			"targetAgentName":   targetAgentName,
			"aliveAgentSkillId": aliveAgentSkill,
			"reason":            deactivateReason,
		},
	)
	out := mapper.ToSkillResp(row, nil)
	return &out, nil
}
