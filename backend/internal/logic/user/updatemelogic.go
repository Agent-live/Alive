package user

import (
	"context"
	"strings"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateMeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateMeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateMeLogic {
	return &UpdateMeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateMeLogic) UpdateMe(req *types.UpdateUserReq) (resp *types.UserResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	update := l.svcCtx.DB.User.UpdateOneID(u.ID)
	if s := strings.TrimSpace(req.Nickname); s != "" {
		update.SetNickname(s)
	}
	if s := strings.TrimSpace(req.Avatar); s != "" {
		update.SetAvatar(s)
	}
	if s := strings.TrimSpace(req.Email); s != "" {
		update.SetEmail(s)
	}
	if s := strings.TrimSpace(req.Bio); s != "" {
		update.SetBio(s)
	}
	if s := strings.TrimSpace(req.Gender); s != "" {
		update.SetGender(s)
	}
	if s := strings.TrimSpace(req.Birthdate); s != "" {
		update.SetBirthdate(s)
	}

	u, err = update.Save(l.ctx)
	if err != nil {
		return nil, err
	}

	agentID := ""
	a, err := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).Only(l.ctx)
	if err == nil {
		agentID = a.ID.String()
	} else if err != nil && !ent.IsNotFound(err) {
		return nil, err
	}

	out := common.ToUserResp(u, agentID)
	return &out, nil
}
