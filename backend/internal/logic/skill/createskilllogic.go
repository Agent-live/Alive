package skill

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/ent/agent"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/logic/notify"
	"backend/internal/mapper"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateSkillLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateSkillLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSkillLogic {
	return &CreateSkillLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateSkillLogic) CreateSkill(req *types.SkillCreateReq) (resp *types.SkillResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	name := strings.TrimSpace(req.Name)
	description := strings.TrimSpace(req.Description)
	instructions := strings.TrimSpace(req.Instructions)
	if name == "" || description == "" || instructions == "" {
		return nil, errors.New("name, description and instructions are required")
	}

	row, err := l.svcCtx.DB.AgentSkill.Create().
		SetOwnerUserID(u.ID).
		SetName(name).
		SetDescription(description).
		SetInstructions(instructions).
		SetStatus(domain.SkillStatusLesson).
		SetCategory(normalizeSkillCategory(req.Category)).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	ownerAgent, ownerErr := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).First(l.ctx)
	if ownerErr == nil && ownerAgent != nil {
		notify.NewEmitter(l.ctx, l.svcCtx).EmitEventToAgentRow(ownerAgent,
			domain.EventSkillShareRequested,
			"ALIVE Skill Share Requested",
			fmt.Sprintf("Skill ready for sharing: %s", row.Name),
			domain.BuildDedupeKey(ownerAgent.ID.String(), domain.EventSkillShareRequested, row.ID.String()),
			map[string]any{
				"skillId":      row.ID.String(),
				"skillName":    row.Name,
				"ownerUserId":  u.ID.String(),
				"ownerAgentId": ownerAgent.ID.String(),
				"category":     row.Category,
				"status":       row.Status,
			},
		)
	}

	out := mapper.ToSkillResp(row, nil)
	return &out, nil
}
