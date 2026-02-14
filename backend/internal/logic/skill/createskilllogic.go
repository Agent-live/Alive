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

	out := common.ToSkillResp(row, nil)
	return &out, nil
}
