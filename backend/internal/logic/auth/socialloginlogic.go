package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/user"
	internalAuth "backend/internal/auth"
	"backend/internal/domain"
	timerlogic "backend/internal/logic/timer"
	"backend/internal/mapper"
	"backend/internal/selector"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/golang-jwt/jwt/v4"
	"github.com/zeromicro/go-zero/core/logx"
)

type SocialLoginLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSocialLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SocialLoginLogic {
	return &SocialLoginLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SocialLoginLogic) SocialLogin(req *types.SocialLoginReq) (resp *types.LoginResp, err error) {
	provider := normalizeProvider(req.Provider)
	if provider == "" {
		return nil, errors.New("provider is required")
	}

	identity, err := l.resolveIdentity(provider, req)
	if err != nil {
		return nil, err
	}

	u, err := l.findOrCreateSocialUser(identity)
	if err != nil {
		return nil, err
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

	phone := ""
	if u.Phone != nil {
		phone = *u.Phone
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

func (l *SocialLoginLogic) resolveIdentity(provider string, req *types.SocialLoginReq) (*internalAuth.SocialIdentity, error) {
	token := strings.TrimSpace(req.IdToken)
	if token == "" {
		token = strings.TrimSpace(req.Token)
	}

	allowInsecureMock := l.svcCtx.Config.Auth.Social.AllowInsecureMock

	switch provider {
	case "google":
		if allowInsecureMock && token == "mock-token" {
			return l.buildMockIdentity(provider, req), nil
		}
		aud := normalizeValues(l.svcCtx.Config.Auth.Social.Google.ClientIDs)
		if len(aud) == 0 {
			return nil, errors.New("google social login is not configured: missing Auth.Social.Google.ClientIDs")
		}
		identity, err := internalAuth.VerifyGoogleIDToken(l.ctx, token, aud)
		if err != nil {
			return nil, err
		}
		mergeIdentityOverrides(identity, req)
		return identity, nil

	case "apple":
		if allowInsecureMock && token == "mock-token" {
			return l.buildMockIdentity(provider, req), nil
		}
		aud := normalizeValues(l.svcCtx.Config.Auth.Social.Apple.ClientIDs)
		if len(aud) == 0 {
			return nil, errors.New("apple social login is not configured: missing Auth.Social.Apple.ClientIDs")
		}
		identity, err := internalAuth.VerifyAppleIDToken(l.ctx, token, aud)
		if err != nil {
			return nil, err
		}
		mergeIdentityOverrides(identity, req)
		return identity, nil

	case "wechat", "twitter":
		return l.buildGenericIdentity(provider, req, token)
	default:
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}
}

func (l *SocialLoginLogic) buildMockIdentity(provider string, req *types.SocialLoginReq) *internalAuth.SocialIdentity {
	subject := strings.TrimSpace(req.ExternalId)
	if subject == "" {
		subject = "mock-" + provider
	}
	return &internalAuth.SocialIdentity{
		Provider: provider,
		Subject:  subject,
		Email:    normalizeEmail(req.Email),
		Name:     strings.TrimSpace(req.Nickname),
		Avatar:   strings.TrimSpace(req.Avatar),
	}
}

func (l *SocialLoginLogic) buildGenericIdentity(provider string, req *types.SocialLoginReq, token string) (*internalAuth.SocialIdentity, error) {
	subject := strings.TrimSpace(req.ExternalId)
	if subject == "" {
		subject = extractSubjectFromToken(token)
	}
	if subject == "" {
		if l.svcCtx.Config.Auth.Social.AllowInsecureMock {
			subject = "mock-" + provider
		} else {
			return nil, errors.New("externalId or token is required")
		}
	}

	identity := &internalAuth.SocialIdentity{
		Provider: provider,
		Subject:  subject,
		Email:    normalizeEmail(req.Email),
		Name:     strings.TrimSpace(req.Nickname),
		Avatar:   strings.TrimSpace(req.Avatar),
	}
	if identity.Name == "" {
		identity.Name = providerDefaultName(provider)
	}

	return identity, nil
}

func (l *SocialLoginLogic) findOrCreateSocialUser(identity *internalAuth.SocialIdentity) (*ent.User, error) {
	socialKey := socialIdentityKey(identity.Provider, identity.Subject)
	canonicalEmail := normalizeEmail(identity.Email)
	if canonicalEmail == "" {
		canonicalEmail = fallbackSocialEmail(identity.Provider, identity.Subject)
	}

	u, err := l.findBySocialKey(socialKey)
	if err != nil {
		return nil, err
	}
	if u != nil {
		return l.updateSocialUserIfNeeded(u, identity, canonicalEmail, socialKey)
	}

	// Backward compatibility: reuse existing account by real email, then bind social key.
	if identity.Email != "" {
		u, err = l.svcCtx.DB.User.Query().Where(user.Email(canonicalEmail)).Only(l.ctx)
		if err != nil && !ent.IsNotFound(err) {
			return nil, err
		}
		if err == nil {
			return l.updateSocialUserIfNeeded(u, identity, canonicalEmail, socialKey)
		}
	}

	nickname := strings.TrimSpace(identity.Name)
	if nickname == "" {
		nickname = providerDefaultName(identity.Provider)
	}

	builder := l.svcCtx.DB.User.Create().
		SetNickname(nickname).
		SetTheme(domain.ThemeSystem).
		SetLanguage(domain.DefaultLanguage).
		SetPasswordHash(socialKey)
	if canonicalEmail != "" {
		builder.SetEmail(canonicalEmail)
	}
	if avatar := strings.TrimSpace(identity.Avatar); avatar != "" {
		builder.SetAvatar(avatar)
	}
	u, err = builder.Save(l.ctx)
	if err == nil {
		return u, nil
	}
	if !ent.IsConstraintError(err) {
		return nil, err
	}

	// Concurrent first-login: another request may have inserted the same row.
	u, qErr := l.findBySocialKey(socialKey)
	if qErr != nil {
		return nil, qErr
	}
	if u != nil {
		return u, nil
	}
	return l.svcCtx.DB.User.Query().Where(user.Email(canonicalEmail)).Only(l.ctx)
}

func (l *SocialLoginLogic) findBySocialKey(socialKey string) (*ent.User, error) {
	users, err := l.svcCtx.DB.User.Query().Where(user.PasswordHash(socialKey)).Limit(1).All(l.ctx)
	if err != nil {
		return nil, err
	}
	if len(users) == 0 {
		return nil, nil
	}
	return users[0], nil
}

func (l *SocialLoginLogic) updateSocialUserIfNeeded(u *ent.User, identity *internalAuth.SocialIdentity, canonicalEmail, socialKey string) (*ent.User, error) {
	updater := l.svcCtx.DB.User.UpdateOneID(u.ID)
	changed := false

	if u.Email == nil && canonicalEmail != "" {
		updater.SetEmail(canonicalEmail)
		changed = true
	}
	if u.PasswordHash == nil {
		updater.SetPasswordHash(socialKey)
		changed = true
	}
	if u.Avatar == nil {
		if avatar := strings.TrimSpace(identity.Avatar); avatar != "" {
			updater.SetAvatar(avatar)
			changed = true
		}
	}
	if strings.TrimSpace(u.Nickname) == "" {
		if name := strings.TrimSpace(identity.Name); name != "" {
			updater.SetNickname(name)
			changed = true
		}
	}

	if !changed {
		return u, nil
	}
	return updater.Save(l.ctx)
}

func normalizeProvider(provider string) string {
	return strings.ToLower(strings.TrimSpace(provider))
}

func normalizeValues(values []string) []string {
	out := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			out = append(out, value)
		}
	}
	return out
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func mergeIdentityOverrides(identity *internalAuth.SocialIdentity, req *types.SocialLoginReq) {
	if identity.Name == "" {
		identity.Name = strings.TrimSpace(req.Nickname)
	}
	if identity.Avatar == "" {
		identity.Avatar = strings.TrimSpace(req.Avatar)
	}
	if identity.Email == "" {
		identity.Email = normalizeEmail(req.Email)
	}
}

func providerDefaultName(provider string) string {
	name := map[string]string{
		"google":  "Google User",
		"apple":   "Apple User",
		"wechat":  "WeChat User",
		"twitter": "X User",
	}[provider]
	if name == "" {
		return "Social User"
	}
	return name
}

func fallbackSocialEmail(provider, subject string) string {
	hash := shortHash(provider + ":" + subject)
	return fmt.Sprintf("%s_%s@alive.social.local", provider, hash)
}

func shortHash(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:12])
}

func socialIdentityKey(provider, subject string) string {
	return "social:" + provider + ":" + shortHash(subject)
}

func extractSubjectFromToken(rawToken string) string {
	token := strings.TrimSpace(rawToken)
	if token == "" {
		return ""
	}

	if strings.Count(token, ".") == 2 {
		claims := jwt.MapClaims{}
		if _, _, err := new(jwt.Parser).ParseUnverified(token, claims); err == nil {
			for _, key := range []string{"sub", "openid", "uid", "user_id", "id"} {
				if value, ok := claims[key].(string); ok {
					value = strings.TrimSpace(value)
					if value != "" {
						return value
					}
				}
			}
		}
	}

	return shortHash(token)
}
