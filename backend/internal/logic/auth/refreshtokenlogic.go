package auth

import (
	"context"
	"errors"
	"strings"

	internalAuth "backend/internal/auth"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type RefreshTokenLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewRefreshTokenLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RefreshTokenLogic {
	return &RefreshTokenLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RefreshTokenLogic) RefreshToken(req *types.RefreshTokenReq) (resp *types.RefreshTokenResp, err error) {
	refresh := strings.TrimSpace(req.RefreshToken)
	if refresh == "" {
		return nil, errors.New("refresh token is required")
	}
	claims, err := internalAuth.ParseToken(l.svcCtx.Config.Auth.AccessSecret, refresh)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}
	newToken, err := internalAuth.GenerateToken(l.svcCtx.Config.Auth.AccessSecret, l.svcCtx.Config.Auth.AccessExpire, claims.UID, claims.Phone)
	if err != nil {
		return nil, err
	}
	return &types.RefreshTokenResp{
		Token:     newToken,
		ExpiresIn: l.svcCtx.Config.Auth.AccessExpire,
	}, nil
}
