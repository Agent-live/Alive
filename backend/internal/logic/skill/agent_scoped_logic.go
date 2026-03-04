package skill

import (
	"context"
	"errors"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agentskill"
	"backend/internal/domain"
	"backend/internal/mapper"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

// AgentScopedSkillLogic provides agent-owned skill operations for MCP agent callers.
// It keeps ORM access inside the skill logic layer instead of MCP dispatch handlers.
type AgentScopedSkillLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewAgentScopedSkillLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AgentScopedSkillLogic {
	return &AgentScopedSkillLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *AgentScopedSkillLogic) ListSkills(agentID uuid.UUID, req *types.SkillListReq) (*types.SkillListResp, error) {
	if req == nil {
		req = &types.SkillListReq{}
	}
	agentRow, err := l.loadAgentRow(agentID)
	if err != nil {
		return nil, err
	}

	query := l.svcCtx.DB.AgentSkill.Query().
		Where(
			agentskill.AgentID(agentID),
			agentskill.DeletedAtIsNil(),
		)
	if status := normalizeSkillStatus(req.Status); status != "" {
		query = query.Where(agentskill.Status(status))
	}

	rows, err := query.Order(ent.Desc(agentskill.FieldCreatedAt)).All(l.ctx)
	if err != nil {
		return nil, err
	}

	items := make([]types.SkillResp, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapper.ToSkillResp(row, agentRow))
	}
	return &types.SkillListResp{Items: items}, nil
}

func (l *AgentScopedSkillLogic) CreateSkill(agentID uuid.UUID, req *types.SkillCreateReq) (*types.SkillResp, error) {
	if req == nil {
		return nil, errors.New("request is required")
	}
	name := strings.TrimSpace(req.Name)
	description := strings.TrimSpace(req.Description)
	instructions := strings.TrimSpace(req.Instructions)
	if name == "" || description == "" || instructions == "" {
		return nil, errors.New("name, description and instructions are required")
	}

	agentRow, err := l.loadAgentRow(agentID)
	if err != nil {
		return nil, err
	}

	row, err := l.svcCtx.DB.AgentSkill.Create().
		SetOwnerUserID(agentRow.CreatorID).
		SetAgentID(agentID).
		SetName(name).
		SetDescription(description).
		SetInstructions(instructions).
		SetStatus(domain.SkillStatusLesson).
		SetCategory(normalizeSkillCategory(req.Category)).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	out := mapper.ToSkillResp(row, agentRow)
	return &out, nil
}

func (l *AgentScopedSkillLogic) UpdateSkill(agentID uuid.UUID, req *types.SkillUpdateReq) (*types.SkillResp, error) {
	if req == nil {
		return nil, errors.New("request is required")
	}
	skillID, err := parseSkillID(req.Id)
	if err != nil {
		return nil, err
	}

	agentRow, err := l.loadAgentRow(agentID)
	if err != nil {
		return nil, err
	}
	existing, err := l.loadAgentScopedSkill(skillID, agentID)
	if err != nil {
		return nil, err
	}

	update := l.svcCtx.DB.AgentSkill.UpdateOneID(existing.ID)
	if v := strings.TrimSpace(req.Name); v != "" {
		update.SetName(v)
	}
	if v := strings.TrimSpace(req.Description); v != "" {
		update.SetDescription(v)
	}
	if v := strings.TrimSpace(req.Instructions); v != "" {
		update.SetInstructions(v)
	}
	if v := strings.TrimSpace(req.Category); v != "" {
		update.SetCategory(normalizeSkillCategory(v))
	}

	row, err := update.Save(l.ctx)
	if err != nil {
		return nil, err
	}
	out := mapper.ToSkillResp(row, agentRow)
	return &out, nil
}

func (l *AgentScopedSkillLogic) DeleteSkill(agentID uuid.UUID, req *types.SkillIdReq) (*types.BaseResp, error) {
	if req == nil {
		return nil, errors.New("request is required")
	}
	skillID, err := parseSkillID(req.Id)
	if err != nil {
		return nil, err
	}

	row, err := l.loadAgentScopedSkill(skillID, agentID)
	if err != nil {
		return nil, err
	}

	if strings.EqualFold(strings.TrimSpace(row.Status), domain.SkillStatusActive) {
		if l.svcCtx.AgentRuntime == nil {
			return nil, errors.New("agent runtime is not available")
		}
		skillRef := strings.TrimSpace(row.Name)
		if v := strings.TrimSpace(domain.PtrString(row.AliveAgentSkillID)); v != "" {
			skillRef = v
		}
		if skillRef != "" {
			_ = l.svcCtx.AgentRuntime.RemoveSkill(l.ctx, agentID.String(), skillRef)
		}
	}

	if _, err := l.svcCtx.DB.AgentSkill.UpdateOneID(skillID).
		SetDeletedAt(time.Now()).
		Save(l.ctx); err != nil {
		return nil, err
	}

	return &types.BaseResp{Success: true}, nil
}

func (l *AgentScopedSkillLogic) DeactivateSkill(agentID uuid.UUID, req *types.SkillIdReq) (*types.SkillResp, error) {
	if req == nil {
		return nil, errors.New("request is required")
	}
	skillID, err := parseSkillID(req.Id)
	if err != nil {
		return nil, err
	}

	row, err := l.loadAgentScopedSkill(skillID, agentID)
	if err != nil {
		return nil, err
	}

	if strings.EqualFold(strings.TrimSpace(row.Status), domain.SkillStatusActive) {
		if l.svcCtx.AgentRuntime == nil {
			return nil, errors.New("agent runtime is not available")
		}
		skillRef := strings.TrimSpace(row.Name)
		if v := strings.TrimSpace(domain.PtrString(row.AliveAgentSkillID)); v != "" {
			skillRef = v
		}
		if skillRef != "" {
			_ = l.svcCtx.AgentRuntime.RemoveSkill(l.ctx, agentID.String(), skillRef)
		}
	}

	updated, err := l.svcCtx.DB.AgentSkill.UpdateOneID(skillID).
		SetStatus(domain.SkillStatusLesson).
		ClearAgentID().
		ClearTaughtAt().
		ClearAliveAgentGatewayID().
		ClearAliveAgentSkillID().
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	out := mapper.ToSkillResp(updated, nil)
	return &out, nil
}

func (l *AgentScopedSkillLogic) loadAgentRow(agentID uuid.UUID) (*ent.Agent, error) {
	return l.svcCtx.DB.Agent.Get(l.ctx, agentID)
}

func (l *AgentScopedSkillLogic) loadAgentScopedSkill(skillID uuid.UUID, agentID uuid.UUID) (*ent.AgentSkill, error) {
	row, err := l.svcCtx.DB.AgentSkill.Query().
		Where(
			agentskill.ID(skillID),
			agentskill.AgentID(agentID),
			agentskill.DeletedAtIsNil(),
		).
		Only(l.ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, errors.New("forbidden")
		}
		return nil, err
	}
	return row, nil
}
