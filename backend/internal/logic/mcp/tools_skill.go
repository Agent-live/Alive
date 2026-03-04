package mcp

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/internal/domain"
	experiencelogic "backend/internal/logic/experience"
	skilllogic "backend/internal/logic/skill"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
)

// skillTools returns tool registrations for skill-related MCP tools.
func skillTools() []toolRegistration {
	return []toolRegistration{
		{
			name:        "alive.list_skills",
			description: "List lesson/active skills visible to current user",
			inputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"status":  map[string]any{"type": "string", "enum": []string{domain.SkillStatusLesson, domain.SkillStatusActive, domain.SkillStatusRejected}},
					"agentId": map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceHuman, audienceAgent},
			requireAgent: false,
			handler:      handleListSkills,
		},
		{
			name:        "alive.create_skill",
			description: "Create a new lesson skill for later sharing, review, or teaching.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"name", "description", "instructions"},
				"properties": map[string]any{
					"name":         map[string]any{"type": "string"},
					"description":  map[string]any{"type": "string"},
					"instructions": map[string]any{"type": "string"},
					"category":     map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceHuman, audienceAgent},
			requireAgent: false,
			handler:      handleCreateSkill,
		},
		{
			name:        "alive.update_skill",
			description: "Update a lesson skill template before teaching or review.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"skillId"},
				"properties": map[string]any{
					"skillId":      map[string]any{"type": "string"},
					"name":         map[string]any{"type": "string"},
					"description":  map[string]any{"type": "string"},
					"instructions": map[string]any{"type": "string"},
					"category":     map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceHuman, audienceAgent},
			requireAgent: false,
			handler:      handleUpdateSkill,
		},
		{
			name:        "alive.delete_skill",
			description: "Delete a skill template or active skill owned by the current user.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"skillId"},
				"properties": map[string]any{
					"skillId": map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceHuman, audienceAgent},
			requireAgent: false,
			handler:      handleDeleteSkill,
		},
		{
			name:        "alive.review_skill",
			description: "Approve or reject one lesson skill in the sharing review flow.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"skillId", "action"},
				"properties": map[string]any{
					"skillId": map[string]any{"type": "string"},
					"action":  map[string]any{"type": "string", "enum": []string{"approve", "reject"}},
					"reason":  map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceHuman},
			requireAgent: false,
			handler:      handleReviewSkill,
		},
		{
			name:        "alive.teach_skill",
			description: "Teach one lesson skill to an agent and bind it in AliveAgent green mode",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"skillId", "agentId"},
				"properties": map[string]any{
					"skillId": map[string]any{"type": "string"},
					"agentId": map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceHuman},
			requireAgent: false,
			handler:      handleTeachSkill,
		},
		{
			name:        "alive.deactivate_skill",
			description: "Deactivate one active skill and detach it from agent",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"skillId"},
				"properties": map[string]any{
					"skillId": map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceHuman, audienceAgent},
			requireAgent: false,
			handler:      handleDeactivateSkill,
		},
		// ── Experience tools ────────────────────────────────────
		{
			name:        "alive.list_experiences",
			description: "List profile experiences timeline for current user",
			inputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"agentId": map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceHuman, audienceAgent},
			requireAgent: false,
			handler:      handleListExperiences,
		},
	}
}

// ---------------------------------------------------------------------------
// Argument structs: skill tools
// ---------------------------------------------------------------------------

type teachSkillArgs struct {
	SkillID string `json:"skillId"`
	AgentID string `json:"agentId"`
}

type createSkillArgs struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	Instructions string `json:"instructions"`
	Category     string `json:"category"`
}

type updateSkillArgs struct {
	SkillID      string `json:"skillId"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Instructions string `json:"instructions"`
	Category     string `json:"category"`
}

type reviewSkillArgs struct {
	SkillID string `json:"skillId"`
	Action  string `json:"action"`
	Reason  string `json:"reason"`
}

type deactivateSkillArgs struct {
	SkillID string `json:"skillId"`
}

// ---------------------------------------------------------------------------
// Handler functions: skill tools (mixed audience)
// ---------------------------------------------------------------------------

func handleListSkills(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, hasAgent bool, rawArgs map[string]any) (any, error) {
	var req types.SkillListReq
	if err := decodeMap(rawArgs, &req); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.list_skills: %w", err)
	}
	if hasAgent {
		return skilllogic.NewAgentScopedSkillLogic(ctx, svcCtx).ListSkills(agentID, &req)
	}
	return skilllogic.NewListSkillsLogic(ctx, svcCtx).ListSkills(&req)
}

func handleCreateSkill(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, hasAgent bool, rawArgs map[string]any) (any, error) {
	var args createSkillArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.create_skill: %w", err)
	}
	if strings.TrimSpace(args.Name) == "" || strings.TrimSpace(args.Description) == "" || strings.TrimSpace(args.Instructions) == "" {
		return nil, errors.New("name, description and instructions are required")
	}
	req := &types.SkillCreateReq{
		Name:         strings.TrimSpace(args.Name),
		Description:  strings.TrimSpace(args.Description),
		Instructions: strings.TrimSpace(args.Instructions),
		Category:     strings.TrimSpace(args.Category),
	}
	if hasAgent {
		return skilllogic.NewAgentScopedSkillLogic(ctx, svcCtx).CreateSkill(agentID, req)
	}
	return skilllogic.NewCreateSkillLogic(ctx, svcCtx).CreateSkill(req)
}

func handleUpdateSkill(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, hasAgent bool, rawArgs map[string]any) (any, error) {
	var args updateSkillArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.update_skill: %w", err)
	}
	skillID := strings.TrimSpace(args.SkillID)
	if skillID == "" {
		return nil, errors.New("skillId is required")
	}
	if hasAgent {
		req := &types.SkillUpdateReq{
			Id:           skillID,
			Name:         strings.TrimSpace(args.Name),
			Description:  strings.TrimSpace(args.Description),
			Instructions: strings.TrimSpace(args.Instructions),
			Category:     strings.TrimSpace(args.Category),
		}
		return skilllogic.NewAgentScopedSkillLogic(ctx, svcCtx).UpdateSkill(agentID, req)
	}
	req := &types.SkillUpdateReq{
		Id:           skillID,
		Name:         strings.TrimSpace(args.Name),
		Description:  strings.TrimSpace(args.Description),
		Instructions: strings.TrimSpace(args.Instructions),
		Category:     strings.TrimSpace(args.Category),
	}
	return skilllogic.NewUpdateSkillLogic(ctx, svcCtx).UpdateSkill(req)
}

func handleDeleteSkill(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, hasAgent bool, rawArgs map[string]any) (any, error) {
	var args deactivateSkillArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.delete_skill: %w", err)
	}
	skillID := strings.TrimSpace(args.SkillID)
	if skillID == "" {
		return nil, errors.New("skillId is required")
	}
	if hasAgent {
		return skilllogic.NewAgentScopedSkillLogic(ctx, svcCtx).DeleteSkill(agentID, &types.SkillIdReq{Id: skillID})
	}
	req := &types.SkillIdReq{Id: skillID}
	return skilllogic.NewDeleteSkillLogic(ctx, svcCtx).DeleteSkill(req)
}

func handleReviewSkill(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, hasAgent bool, rawArgs map[string]any) (any, error) {
	var args reviewSkillArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.review_skill: %w", err)
	}
	skillID := strings.TrimSpace(args.SkillID)
	if skillID == "" {
		return nil, errors.New("skillId is required")
	}
	action := strings.ToLower(strings.TrimSpace(args.Action))
	if action != "approve" && action != "reject" {
		return nil, errors.New("action must be approve or reject")
	}
	req := &types.SkillReviewReq{
		Id:     skillID,
		Action: action,
		Reason: strings.TrimSpace(args.Reason),
	}
	return skilllogic.NewReviewSkillLogic(ctx, svcCtx).ReviewSkill(req)
}

func handleTeachSkill(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, hasAgent bool, rawArgs map[string]any) (any, error) {
	var args teachSkillArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.teach_skill: %w", err)
	}
	if strings.TrimSpace(args.SkillID) == "" || strings.TrimSpace(args.AgentID) == "" {
		return nil, errors.New("skillId and agentId are required")
	}
	req := &types.SkillTeachReq{
		Id:      strings.TrimSpace(args.SkillID),
		AgentId: strings.TrimSpace(args.AgentID),
	}
	return skilllogic.NewTeachSkillLogic(ctx, svcCtx).TeachSkill(req)
}

func handleDeactivateSkill(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, hasAgent bool, rawArgs map[string]any) (any, error) {
	var args deactivateSkillArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.deactivate_skill: %w", err)
	}
	if strings.TrimSpace(args.SkillID) == "" {
		return nil, errors.New("skillId is required")
	}
	if hasAgent {
		return skilllogic.NewAgentScopedSkillLogic(ctx, svcCtx).DeactivateSkill(agentID, &types.SkillIdReq{Id: strings.TrimSpace(args.SkillID)})
	}
	req := &types.SkillIdReq{Id: strings.TrimSpace(args.SkillID)}
	return skilllogic.NewDeactivateSkillLogic(ctx, svcCtx).DeactivateSkill(req)
}

// ---------------------------------------------------------------------------
// Handler functions: experience tools
// ---------------------------------------------------------------------------

func handleListExperiences(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, hasAgent bool, rawArgs map[string]any) (any, error) {
	var req types.ExperienceListReq
	if err := decodeMap(rawArgs, &req); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.list_experiences: %w", err)
	}
	// When called by an agent and no explicit agentId is set, scope to self.
	if hasAgent && strings.TrimSpace(req.AgentId) == "" {
		req.AgentId = agentID.String()
	}
	return experiencelogic.NewListExperiencesLogic(ctx, svcCtx).ListExperiences(&req)
}
