package user

import (
	"context"
	"strings"

	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateSettingsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateSettingsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateSettingsLogic {
	return &UpdateSettingsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateSettingsLogic) UpdateSettings(req *types.UserSettingsResp) (resp *types.UserSettingsResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	update := l.svcCtx.DB.User.UpdateOneID(u.ID)
	if s := strings.TrimSpace(req.Theme); s != "" {
		update.SetTheme(s)
	}
	if s := strings.TrimSpace(req.Language); s != "" {
		update.SetLanguage(s)
	}
	u, err = update.Save(l.ctx)
	if err != nil {
		return nil, err
	}

	return &types.UserSettingsResp{
		Theme:    u.Theme,
		Language: u.Language,
	}, nil
}
