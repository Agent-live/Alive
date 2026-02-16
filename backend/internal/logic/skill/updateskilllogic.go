package skill

import (
	"context"
	"errors"
	"strings"

	"backend/internal/logic/common"
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

	update := l.svcCtx.DB.AgentSkill.UpdateOneID(skillID)
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

	row, err = update.Save(l.ctx)
	if err != nil {
		return nil, err
	}

	var aID string
	if row.AgentID != nil {
		aID = row.AgentID.String()
	}
	var agentName, agentAvatar string
	if aID != "" {
		agentRow, err := l.svcCtx.DB.Agent.Get(l.ctx, *row.AgentID)
		if err == nil {
			agentName = agentRow.Name
			agentAvatar = common.PtrString(agentRow.Avatar)
		}
	}

	out := common.ToSkillResp(row, nil)
	out.AgentName = agentName
	out.AgentAvatar = agentAvatar
	return &out, nil
}
