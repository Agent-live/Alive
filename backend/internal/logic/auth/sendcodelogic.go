package auth

import (
	"context"
	"strings"
	"time"

	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type SendCodeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSendCodeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SendCodeLogic {
	return &SendCodeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SendCodeLogic) SendCode(req *types.SendCodeReq) (resp *types.SendCodeResp, err error) {
	phone := strings.TrimSpace(req.Phone)
	if phone == "" {
		return nil, domain.NewValidationError("phone is required")
	}

	_, err = common.EnsureDefaultUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	code, err := common.GenerateVerificationCode()
	if err != nil {
		return nil, err
	}
	expiresAt := time.Now().Add(5 * time.Minute)
	_, err = l.svcCtx.DB.VerificationCode.Create().
		SetPhone(phone).
		SetCode(code).
		SetExpiresAt(expiresAt).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	resp = &types.SendCodeResp{
		Success:   true,
		ExpiresIn: 300,
	}

	// In dev mode, return the code in the response and log it for debugging.
	if l.svcCtx.Config.Auth.AllowDevCode {
		resp.DevCode = &code
		logx.WithContext(l.ctx).Infof("[auth] dev verification code for %s: %s", phone, code)
	}

	return resp, nil
}
