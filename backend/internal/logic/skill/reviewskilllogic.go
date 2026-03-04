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

type ReviewSkillLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewReviewSkillLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ReviewSkillLogic {
	return &ReviewSkillLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ReviewSkillLogic) ReviewSkill(req *types.SkillReviewReq) (resp *types.SkillResp, err error) {
	skillID, err := parseSkillID(req.Id)
	if err != nil {
		return nil, err
	}
	action := normalizeSkillReviewAction(req.Action)
	if action == "" {
		return nil, errors.New("action must be approve or reject")
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
	if row.AgentID != nil || strings.EqualFold(strings.TrimSpace(row.Status), domain.SkillStatusActive) {
		return nil, errors.New("only lesson skills can be reviewed")
	}

	reason := strings.TrimSpace(req.Reason)
	beforeStatus := strings.TrimSpace(row.Status)
	afterStatus := beforeStatus
	eventType := domain.EventSkillShareApproved
	title := "ALIVE Skill Share Approved"
	message := fmt.Sprintf("Skill approved for sharing: %s", row.Name)
	if action == "reject" {
		afterStatus = domain.SkillStatusRejected
		eventType = domain.EventSkillShareRejected
		title = "ALIVE Skill Share Rejected"
		message = fmt.Sprintf("Skill rejected for sharing: %s", row.Name)
	} else {
		// Approved share templates use lesson status in the current data model.
		afterStatus = domain.SkillStatusLesson
	}

	if !strings.EqualFold(beforeStatus, afterStatus) {
		row, err = l.svcCtx.DB.AgentSkill.UpdateOneID(row.ID).
			SetStatus(afterStatus).
			Save(l.ctx)
		if err != nil {
			return nil, err
		}
	}

	ownerAgent, ownerErr := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).First(l.ctx)
	if ownerErr == nil && ownerAgent != nil {
		notify.NewEmitter(l.ctx, l.svcCtx).EmitEventToAgentRow(ownerAgent,
			eventType,
			title,
			message,
			domain.BuildDedupeKey(
				ownerAgent.ID.String(),
				eventType,
				row.ID.String(),
				afterStatus,
				reason,
			),
			map[string]any{
				"skillId":       row.ID.String(),
				"skillName":     row.Name,
				"ownerUserId":   u.ID.String(),
				"ownerAgentId":  ownerAgent.ID.String(),
				"action":        action,
				"reason":        reason,
				"beforeStatus":  beforeStatus,
				"afterStatus":   afterStatus,
				"templateSkill": true,
				"category":      row.Category,
			},
		)
	}

	out := mapper.ToSkillResp(row, nil)
	return &out, nil
}
