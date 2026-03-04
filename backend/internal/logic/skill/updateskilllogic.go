package skill

import (
	"context"
	"errors"
	"strings"

	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/mapper"
	"backend/internal/port"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSkillLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateSkillLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSkillLogic {
	return &UpdateSkillLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateSkillLogic) UpdateSkill(req *types.SkillUpdateReq) (resp *types.SkillResp, err error) {
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
	if row.DeletedAt != nil {
		return nil, errors.New("skill already deleted")
	}

	nextName := strings.TrimSpace(row.Name)
	nextDescription := strings.TrimSpace(row.Description)
	nextInstructions := strings.TrimSpace(row.Instructions)
	nextCategory := strings.TrimSpace(row.Category)

	if v := strings.TrimSpace(req.Name); v != "" {
		nextName = v
	}
	if v := strings.TrimSpace(req.Description); v != "" {
		nextDescription = v
	}
	if v := strings.TrimSpace(req.Instructions); v != "" {
		nextInstructions = v
	}
	if v := strings.TrimSpace(req.Category); v != "" {
		nextCategory = normalizeSkillCategory(v)
	}

	nameChanged := nextName != strings.TrimSpace(row.Name)
	descriptionChanged := nextDescription != strings.TrimSpace(row.Description)
	instructionsChanged := nextInstructions != strings.TrimSpace(row.Instructions)

	var binding *port.BindSkillResult
	if row.Status == domain.SkillStatusActive && row.AgentID != nil {
		if nameChanged {
			// Runtime skill keys are derived from skill name; renaming active skills
			// can leave stale keys. Enforce deactivate -> rename -> teach.
			return nil, errors.New("cannot rename active skill; deactivate and re-teach instead")
		}
		if descriptionChanged || instructionsChanged {
			binding, err = l.bindActiveSkill(row.AgentID.String(), nextName, nextDescription, nextInstructions)
			if err != nil {
				return nil, err
			}
		}
	}

	update := l.svcCtx.DB.AgentSkill.UpdateOneID(skillID).
		SetName(nextName).
		SetDescription(nextDescription).
		SetInstructions(nextInstructions).
		SetCategory(nextCategory)
	if binding != nil {
		update.SetAliveAgentGatewayID(strings.TrimSpace(binding.GatewayID)).
			SetAliveAgentSkillID(strings.TrimSpace(binding.SkillID))
	}

	row, err = update.Save(l.ctx)
	if err != nil {
		return nil, err
	}

	var agentName, agentAvatar string
	if row.AgentID != nil {
		agentRow, getErr := l.svcCtx.DB.Agent.Get(l.ctx, *row.AgentID)
		if getErr == nil {
			agentName = strings.TrimSpace(agentRow.Name)
			agentAvatar = domain.PtrString(agentRow.Avatar)
		}
	}

	out := mapper.ToSkillResp(row, nil)
	out.AgentName = agentName
	out.AgentAvatar = agentAvatar
	return &out, nil
}

func (l *UpdateSkillLogic) bindActiveSkill(agentID, name, description, instructions string) (*port.BindSkillResult, error) {
	if l.svcCtx.AgentRuntime == nil {
		return nil, errors.New("agent runtime is not available")
	}
	return l.svcCtx.AgentRuntime.BindSkill(l.ctx, port.BindSkillRequest{
		AgentID:      strings.TrimSpace(agentID),
		SkillName:    strings.TrimSpace(name),
		Description:  strings.TrimSpace(description),
		Instructions: strings.TrimSpace(instructions),
	})
}
