package skill

import (
	"context"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agentskill"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/logic/notify"
	"backend/internal/mapper"
	"backend/internal/port"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type TeachSkillLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewTeachSkillLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TeachSkillLogic {
	return &TeachSkillLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *TeachSkillLogic) TeachSkill(req *types.SkillTeachReq) (resp *types.SkillResp, err error) {
	skillID, err := parseSkillID(req.Id)
	if err != nil {
		return nil, err
	}
	agentID, err := uuid.Parse(req.AgentId)
	if err != nil {
		return nil, domain.NewValidationError("invalid agent id")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	template, err := l.svcCtx.DB.AgentSkill.Get(l.ctx, skillID)
	if err != nil {
		return nil, err
	}
	if template.OwnerUserID != u.ID || template.DeletedAt != nil {
		return nil, domain.NewValidationError("skill not found")
	}
	if strings.EqualFold(strings.TrimSpace(template.Status), domain.SkillStatusRejected) {
		return nil, domain.NewValidationError("skill is rejected and cannot be taught")
	}

	targetAgent, err := l.svcCtx.DB.Agent.Get(l.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if targetAgent.CreatorID != u.ID {
		return nil, domain.NewForbiddenError("forbidden")
	}

	var activeSkill *ent.AgentSkill
	activeSkill, err = l.svcCtx.DB.AgentSkill.Query().
		Where(
			agentskill.OwnerUserID(u.ID),
			agentskill.AgentID(agentID),
			agentskill.Status(domain.SkillStatusActive),
			agentskill.Name(template.Name),
			agentskill.DeletedAtIsNil(),
		).
		First(l.ctx)
	if err != nil && !ent.IsNotFound(err) {
		return nil, err
	}

	// Call BindSkill BEFORE creating the DB row so that a gateway failure
	// does not leave an orphaned active-skill record with no binding.
	var binding *port.BindSkillResult
	if l.svcCtx.AgentRuntime != nil {
		binding, err = l.svcCtx.AgentRuntime.BindSkill(l.ctx, port.BindSkillRequest{
			AgentID:      targetAgent.ID.String(),
			SkillName:    template.Name,
			Description:  template.Description,
			Instructions: template.Instructions,
		})
		if err != nil {
			return nil, err
		}
	}

	if activeSkill == nil {
		create := l.svcCtx.DB.AgentSkill.Create().
			SetOwnerUserID(u.ID).
			SetAgentID(agentID).
			SetName(template.Name).
			SetDescription(template.Description).
			SetInstructions(template.Instructions).
			SetStatus(domain.SkillStatusActive).
			SetCategory(template.Category).
			SetTaughtAt(time.Now())
		if template.Version != nil {
			create.SetVersion(*template.Version)
		}
		if template.Status == domain.SkillStatusLesson {
			create.SetSourceSkillID(template.ID)
		}
		if binding != nil {
			create.SetAliveAgentGatewayID(binding.GatewayID).
				SetAliveAgentSkillID(binding.SkillID)
		}
		activeSkill, err = create.Save(l.ctx)
		if err != nil {
			return nil, err
		}
	} else if binding != nil {
		// Existing active skill — update it with the fresh gateway binding.
		activeSkill, err = l.svcCtx.DB.AgentSkill.UpdateOneID(activeSkill.ID).
			SetStatus(domain.SkillStatusActive).
			SetAgentID(agentID).
			SetTaughtAt(time.Now()).
			SetAliveAgentGatewayID(binding.GatewayID).
			SetAliveAgentSkillID(binding.SkillID).
			Save(l.ctx)
		if err != nil {
			return nil, err
		}
	}

	emitter := notify.NewEmitter(l.ctx, l.svcCtx)
	emitter.EmitEventToAgentRow(targetAgent,
		domain.EventSkillTeachStarted,
		"ALIVE Skill Teaching Started",
		fmt.Sprintf("Teaching skill %s to %s", activeSkill.Name, targetAgent.Name),
		domain.BuildDedupeKey(targetAgent.ID.String(), domain.EventSkillTeachStarted, activeSkill.ID.String(), activeSkill.Name),
		map[string]any{
			"skillId":       activeSkill.ID.String(),
			"skillName":     activeSkill.Name,
			"sourceSkillId": domain.UUIDStringPtr(activeSkill.SourceSkillID),
			"targetAgentId": targetAgent.ID.String(),
			"targetName":    targetAgent.Name,
		},
	)
	emitter.EmitEventToAgentRow(targetAgent,
		domain.EventSkillTaughtToAgent,
		"ALIVE Skill Taught",
		fmt.Sprintf("Skill taught: %s", activeSkill.Name),
		domain.BuildDedupeKey(targetAgent.ID.String(), domain.EventSkillTaughtToAgent, activeSkill.ID.String(), domain.PtrString(activeSkill.AliveAgentSkillID)),
		map[string]any{
			"skillId":                activeSkill.ID.String(),
			"skillName":              activeSkill.Name,
			"targetAgentId":          targetAgent.ID.String(),
			"aliveAgentSkillId":      domain.PtrString(activeSkill.AliveAgentSkillID),
			"aliveAgentGatewayId":    domain.PtrString(activeSkill.AliveAgentGatewayID),
			"status":                 activeSkill.Status,
			"sourceSkillId":          domain.UUIDStringPtr(activeSkill.SourceSkillID),
			"disableModelInvocation": false,
		},
	)
	// Learning module signal: successful learning snapshot.
	emitter.EmitEventToAgentRow(targetAgent,
		"learning.skill_learned",
		"ALIVE Learning Update",
		fmt.Sprintf("Learned skill: %s", activeSkill.Name),
		domain.BuildDedupeKey(targetAgent.ID.String(), "learning.skill_learned", activeSkill.ID.String(), activeSkill.Name),
		map[string]any{
			"skillId":       activeSkill.ID.String(),
			"key":           activeSkill.Name,
			"name":          activeSkill.Name,
			"source":        "alive.skill.teach",
			"targetAgentId": targetAgent.ID.String(),
		},
	)
	emitter.EmitEventToAgentRow(targetAgent,
		"learning.skill_mastery_updated",
		"ALIVE Learning Mastery",
		fmt.Sprintf("Skill mastery initialized: %s", activeSkill.Name),
		domain.BuildDedupeKey(targetAgent.ID.String(), "learning.skill_mastery_updated", activeSkill.ID.String(), "novice"),
		map[string]any{
			"skillId":       activeSkill.ID.String(),
			"key":           activeSkill.Name,
			"masteryLevel":  "novice",
			"runCount":      0,
			"successCount":  0,
			"failureCount":  0,
			"targetAgentId": targetAgent.ID.String(),
		},
	)

	_, _ = l.svcCtx.DB.AgentExperience.Create().
		SetOwnerUserID(u.ID).
		SetAgentID(targetAgent.ID).
		SetAgentName(targetAgent.Name).
		SetNillableAgentAvatar(targetAgent.Avatar).
		SetExpType("milestone").
		SetTitle(fmt.Sprintf("Taught skill: %s", activeSkill.Name)).
		SetDescription(fmt.Sprintf("You taught \"%s\" to %s.", activeSkill.Name, targetAgent.Name)).
		SetEventAt(time.Now()).
		Save(l.ctx)

	out := mapper.ToSkillResp(activeSkill, targetAgent)
	return &out, nil
}
