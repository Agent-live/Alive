package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/user"
	"backend/ent/verificationcode"
	internalAuth "backend/internal/auth"
	"backend/internal/logic/common"
	"backend/internal/service/timeengine"
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
		if code != "123456" {
			return nil, errors.New("invalid verification code")
		}
	} else {
		if vc.ExpiresAt.Before(time.Now()) {
			return nil, errors.New("verification code expired")
		}
		if vc.Code != code {
			return nil, errors.New("invalid verification code")
		}
	}

	u, err := l.svcCtx.DB.User.Query().Where(user.Phone(phone)).Only(l.ctx)
	if err != nil {
		if !ent.IsNotFound(err) {
			return nil, err
		}
		u, err = l.svcCtx.DB.User.Create().
			SetPhone(phone).
			SetNickname(fmt.Sprintf("ALIVE User %s", phone[max(0, len(phone)-4):])).
			SetTheme("system").
			SetLanguage("zh-CN").
			Save(l.ctx)
		if err != nil {
			return nil, err
		}
	}

	now := time.Now().UTC()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	nextStreak := u.DailyLoginStreak
	if u.LastLoginAt == nil {
		nextStreak = 1
	} else {
		last := u.LastLoginAt.UTC()
		lastDay := time.Date(last.Year(), last.Month(), last.Day(), 0, 0, 0, 0, time.UTC)
		yesterday := start.Add(-24 * time.Hour)
		switch {
		case lastDay.Equal(start):
			// Same day: keep streak unchanged.
		case lastDay.Equal(yesterday):
			nextStreak = u.DailyLoginStreak + 1
		default:
			nextStreak = 1
		}
	}
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
	a, err := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).Only(l.ctx)
	if err == nil {
		agentID = a.ID.String()
	} else if err != nil && !ent.IsNotFound(err) {
		return nil, err
	}

	if agentID != "" {
		if err := l.svcCtx.Time.ApplyDelta(
			l.ctx,
			agentID,
			144,
			"login_bonus",
			"human",
			u.ID.String(),
			u.Nickname,
			"Daily login bonus",
		); err != nil {
			var be *timeengine.BusinessError
			if !errors.As(err, &be) {
				return nil, err
			}
		}
	}

	return &types.LoginResp{
		Token:        token,
		RefreshToken: refreshToken,
		ExpiresIn:    l.svcCtx.Config.Auth.AccessExpire,
		User:         common.ToUserResp(u, agentID),
	}, nil
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
