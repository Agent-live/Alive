package skill

import (
	"context"
	"errors"
	"time"
	"strings"

	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteSkillLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteSkillLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteSkillLogic {
	return &DeleteSkillLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteSkillLogic) DeleteSkill(req *types.SkillIdReq) (resp *types.BaseResp, err error) {
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

	// Best-effort: remove the bound workspace skill so OpenClaw stops loading it.
	if row.AgentID != nil && row.Status == "active" {
		skillRef := row.Name
		if row.OpenclawSkillID != nil && strings.TrimSpace(*row.OpenclawSkillID) != "" {
			skillRef = *row.OpenclawSkillID
		}
		_ = l.svcCtx.OpenClaw.RemoveSkill(l.ctx, row.AgentID.String(), skillRef)
	}

	now := time.Now()
	if _, err = l.svcCtx.DB.AgentSkill.UpdateOneID(skillID).SetDeletedAt(now).Save(l.ctx); err != nil {
		return nil, err
	}
	return &types.BaseResp{Success: true}, nil
}
