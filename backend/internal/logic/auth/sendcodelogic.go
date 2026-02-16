package auth

import (
	"context"
	"errors"
	"strings"
	"time"

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
		return nil, errors.New("phone is required")
	}

	_, err = common.EnsureDefaultUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	expiresAt := time.Now().Add(5 * time.Minute)
	_, err = l.svcCtx.DB.VerificationCode.Create().
		SetPhone(phone).
		SetCode("123456").
		SetExpiresAt(expiresAt).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	return &types.SendCodeResp{
		Success:   true,
		ExpiresIn: 300,
	}, nil
}
