package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/user"
	"backend/ent/verificationcode"
	internalAuth "backend/internal/auth"
	"backend/internal/domain"
	timerlogic "backend/internal/logic/timer"
	"backend/internal/mapper"
	"backend/internal/selector"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type LoginLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LoginLogic {
	return &LoginLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LoginLogic) Login(req *types.LoginReq) (resp *types.LoginResp, err error) {
	phone := strings.TrimSpace(req.Phone)
	code := strings.TrimSpace(req.Code)
	if phone == "" || code == "" {
		return nil, errors.New("phone and code are required")
	}

	vc, err := l.svcCtx.DB.VerificationCode.Query().
		Where(verificationcode.Phone(phone)).
		Order(ent.Desc(verificationcode.FieldCreatedAt)).
		First(l.ctx)
	if err != nil {
		if !ent.IsNotFound(err) {
			return nil, err
		}
		return nil, errors.New("invalid verification code")
	}
	if vc.ExpiresAt.Before(time.Now()) {
		return nil, errors.New("verification code expired")
	}
	if vc.Code != code {
		return nil, errors.New("invalid verification code")
	}

	u, err := l.svcCtx.DB.User.Query().Where(user.Phone(phone)).Only(l.ctx)
	if err != nil {
		if !ent.IsNotFound(err) {
			return nil, err
		}
		u, err = l.svcCtx.DB.User.Create().
			SetPhone(phone).
			SetNickname(fmt.Sprintf("ALIVE User %s", phone[max(0, len(phone)-4):])).
			SetTheme(domain.ThemeSystem).
			SetLanguage(domain.DefaultLanguage).
			Save(l.ctx)
		if err != nil {
			return nil, err
		}
	}

	now := time.Now().UTC()
	nextStreak := timerlogic.CalculateDailyLoginStreak(u.DailyLoginStreak, u.LastLoginAt)
	u, err = l.svcCtx.DB.User.UpdateOneID(u.ID).
		SetLastLoginAt(now).
		SetDailyLoginStreak(nextStreak).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	token, err := internalAuth.GenerateToken(l.svcCtx.Config.Auth.AccessSecret, l.svcCtx.Config.Auth.AccessExpire, u.ID.String(), phone)
	if err != nil {
		return nil, err
	}
	refreshToken, err := internalAuth.GenerateToken(l.svcCtx.Config.Auth.AccessSecret, l.svcCtx.Config.Auth.AccessExpire*4, u.ID.String(), phone)
	if err != nil {
		return nil, err
	}

	agentID := ""
	a, err := selector.ResolveDefaultOwnedAgentForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err == nil && a != nil {
		agentID = a.ID.String()
	}

	return &types.LoginResp{
		Token:        token,
		RefreshToken: refreshToken,
		ExpiresIn:    l.svcCtx.Config.Auth.AccessExpire,
		User:         mapper.ToUserResp(u, agentID),
	}, nil
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

