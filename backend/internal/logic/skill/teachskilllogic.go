package skill

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agentskill"
	"backend/internal/aliveagent"
	"backend/internal/logic/common"
	"backend/internal/skillshop"
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
		return nil, errors.New("invalid agent id")
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
		return nil, errors.New("skill not found")
	}
	if strings.EqualFold(strings.TrimSpace(template.Status), "rejected") {
		return nil, errors.New("skill is rejected and cannot be taught")
	}

	targetAgent, err := l.svcCtx.DB.Agent.Get(l.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if targetAgent.CreatorID != u.ID {
		return nil, errors.New("forbidden")
	}

	var activeSkill *ent.AgentSkill
	activeSkill, err = l.svcCtx.DB.AgentSkill.Query().
		Where(
			agentskill.OwnerUserID(u.ID),
			agentskill.AgentID(agentID),
			agentskill.Status("active"),
			agentskill.Name(template.Name),
			agentskill.DeletedAtIsNil(),
		).
		First(l.ctx)
	if err != nil && !ent.IsNotFound(err) {
		return nil, err
	}

	if activeSkill == nil {
		create := l.svcCtx.DB.AgentSkill.Create().
			SetOwnerUserID(u.ID).
			SetAgentID(agentID).
			SetName(template.Name).
			SetDescription(template.Description).
			SetInstructions(template.Instructions).
			SetStatus("active").
			SetCategory(template.Category).
			SetTaughtAt(time.Now())
		if template.Version != nil {
			create.SetVersion(*template.Version)
		}
		if template.Status == "lesson" {
			create.SetSourceSkillID(template.ID)
		}
		activeSkill, err = create.Save(l.ctx)
		if err != nil {
			return nil, err
		}
	}

	runtimeAgentID := strings.TrimSpace(common.PtrString(targetAgent.AliveAgentRuntimeID))
	if runtimeAgentID != "" && l.svcCtx.AliveAgent != nil {
		_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
			RuntimeAgentID: runtimeAgentID,
			AgentID:        targetAgent.ID.String(),
			EventType:      "skill.teach_started",
			Title:          "ALIVE Skill Teaching Started",
			Message:        fmt.Sprintf("Teaching skill %s to %s", activeSkill.Name, targetAgent.Name),
			DedupeKey:      aliveagent.BuildDedupeKey(targetAgent.ID.String(), "skill.teach_started", activeSkill.ID.String(), activeSkill.Name),
			Payload: map[string]any{
				"skillId":       activeSkill.ID.String(),
				"skillName":     activeSkill.Name,
				"sourceSkillId": common.UUIDStringPtr(activeSkill.SourceSkillID),
				"targetAgentId": targetAgent.ID.String(),
				"targetName":    targetAgent.Name,
			},
			TimeoutSeconds: 120,
		})
	}

	// If this skill exists in the local AliveAgent skills checkout, prefer copying the full folder
	// into the agent workspace (preserves _meta.json, scripts/, references/, etc).
	localSourceDir := ""
	if cat, err := skillshop.LoadBundledCatalog(); err == nil {
		if it, ok := cat.GetBySlug(activeSkill.Name); ok {
			if dir, ok := skillshop.LocalRepoPath(filepath.Dir(it.RepoPath)); ok {
				if st, err := os.Stat(dir); err == nil && st.IsDir() {
					localSourceDir = dir
				}
			}
		}
	}

	binding, err := l.svcCtx.AliveAgent.BindSkill(l.ctx, aliveagent.BindSkillRequest{
		AgentID:        targetAgent.ID.String(),
		SkillName:      activeSkill.Name,
		Description:    activeSkill.Description,
		Instructions:   activeSkill.Instructions,
		LocalSourceDir: localSourceDir,
	})
	if err != nil {
		return nil, err
	}

	activeSkill, err = l.svcCtx.DB.AgentSkill.UpdateOneID(activeSkill.ID).
		SetStatus("active").
		SetAgentID(agentID).
		SetTaughtAt(time.Now()).
		SetAliveAgentGatewayID(binding.GatewayID).
		SetAliveAgentSkillID(binding.SkillID).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	if runtimeAgentID != "" && l.svcCtx.AliveAgent != nil {
		payload := map[string]any{
			"skillId":                activeSkill.ID.String(),
			"skillName":              activeSkill.Name,
			"targetAgentId":          targetAgent.ID.String(),
			"aliveAgentSkillId":      common.PtrString(activeSkill.AliveAgentSkillID),
			"aliveAgentGatewayId":    common.PtrString(activeSkill.AliveAgentGatewayID),
			"status":                 activeSkill.Status,
			"sourceSkillId":          common.UUIDStringPtr(activeSkill.SourceSkillID),
			"disableModelInvocation": false,
		}
		_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
			RuntimeAgentID: runtimeAgentID,
			AgentID:        targetAgent.ID.String(),
			EventType:      "skill.taught_to_agent",
			Title:          "ALIVE Skill Taught",
			Message:        fmt.Sprintf("Skill taught: %s", activeSkill.Name),
			DedupeKey:      aliveagent.BuildDedupeKey(targetAgent.ID.String(), "skill.taught_to_agent", activeSkill.ID.String(), common.PtrString(activeSkill.AliveAgentSkillID)),
			Payload:        payload,
			TimeoutSeconds: 120,
		})
		// Learning module signal: successful learning snapshot.
		_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
			RuntimeAgentID: runtimeAgentID,
			AgentID:        targetAgent.ID.String(),
			EventType:      "learning.skill_learned",
			Title:          "ALIVE Learning Update",
			Message:        fmt.Sprintf("Learned skill: %s", activeSkill.Name),
			DedupeKey:      aliveagent.BuildDedupeKey(targetAgent.ID.String(), "learning.skill_learned", activeSkill.ID.String(), activeSkill.Name),
			Payload: map[string]any{
				"skillId":       activeSkill.ID.String(),
				"key":           activeSkill.Name,
				"name":          activeSkill.Name,
				"source":        "alive.skill.teach",
				"targetAgentId": targetAgent.ID.String(),
			},
			TimeoutSeconds: 120,
		})
		_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
			RuntimeAgentID: runtimeAgentID,
			AgentID:        targetAgent.ID.String(),
			EventType:      "learning.skill_mastery_updated",
			Title:          "ALIVE Learning Mastery",
			Message:        fmt.Sprintf("Skill mastery initialized: %s", activeSkill.Name),
			DedupeKey:      aliveagent.BuildDedupeKey(targetAgent.ID.String(), "learning.skill_mastery_updated", activeSkill.ID.String(), "novice"),
			Payload: map[string]any{
				"skillId":       activeSkill.ID.String(),
				"key":           activeSkill.Name,
				"masteryLevel":  "novice",
				"runCount":      0,
				"successCount":  0,
				"failureCount":  0,
				"targetAgentId": targetAgent.ID.String(),
			},
			TimeoutSeconds: 120,
		})
	}

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

	out := common.ToSkillResp(activeSkill, targetAgent)
	return &out, nil
}
