package skill

import (
	"context"
	"errors"

	"backend/internal/logic/common"
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

	row, err = l.svcCtx.DB.AgentSkill.UpdateOneID(skillID).
		SetStatus("lesson").
		ClearAgentID().
		ClearTaughtAt().
		ClearOpenclawGatewayID().
		ClearOpenclawSkillID().
		Save(l.ctx)
	if err != nil {
		return nil, err
	}
	out := common.ToSkillResp(row, nil)
	return &out, nil
}
