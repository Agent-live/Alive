package skill

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/ent/agent"
	"backend/internal/aliveagent"
	"backend/internal/logic/common"
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
		SetStatus("lesson").
		SetCategory(normalizeSkillCategory(req.Category)).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	if l.svcCtx.AliveAgent != nil {
		ownerAgent, ownerErr := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).First(l.ctx)
		if ownerErr == nil && ownerAgent != nil {
			runtimeAgentID := strings.TrimSpace(common.PtrString(ownerAgent.AliveAgentRuntimeID))
			if runtimeAgentID != "" {
				_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
					RuntimeAgentID: runtimeAgentID,
					AgentID:        ownerAgent.ID.String(),
					EventType:      "skill.share_requested",
					Title:          "ALIVE Skill Share Requested",
					Message:        fmt.Sprintf("Skill ready for sharing: %s", row.Name),
					DedupeKey:      aliveagent.BuildDedupeKey(ownerAgent.ID.String(), "skill.share_requested", row.ID.String()),
					Payload: map[string]any{
						"skillId":      row.ID.String(),
						"skillName":    row.Name,
						"ownerUserId":  u.ID.String(),
						"ownerAgentId": ownerAgent.ID.String(),
						"category":     row.Category,
						"status":       row.Status,
					},
					TimeoutSeconds: 120,
				})
			}
		}
	}

	out := common.ToSkillResp(row, nil)
	return &out, nil
}
