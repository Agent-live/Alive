package common

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"

	"backend/ent"
	"backend/ent/user"
	"backend/internal/domain"

	"github.com/google/uuid"
)

const (
	DefaultUserPhone = "13800138000"
	DefaultNickname  = "ALIVE Explorer"
)

// UserIDFromContext extracts the authenticated user ID from the go-zero JWT context.
func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	v := ctx.Value(domain.CtxKeyUIDRaw)
	if v == nil {
		return uuid.Nil, false
	}
	switch val := v.(type) {
	case string:
		id, err := uuid.Parse(strings.TrimSpace(val))
		if err == nil {
			return id, true
		}
	}
	return uuid.Nil, false
}

// EnsureDefaultUser creates or retrieves the platform default user.
func EnsureDefaultUser(ctx context.Context, db *ent.Client) (*ent.User, error) {
	u, err := db.User.Query().Where(user.Phone(DefaultUserPhone)).Only(ctx)
	if err == nil {
		return u, nil
	}
	if !ent.IsNotFound(err) {
		return nil, err
	}
	return db.User.Create().
		SetPhone(DefaultUserPhone).
		SetNickname(DefaultNickname).
		SetTheme(domain.ThemeSystem).
		SetLanguage(domain.DefaultLanguage).
		Save(ctx)
}

// CurrentUser returns the authenticated user from context.
func CurrentUser(ctx context.Context, db *ent.Client) (*ent.User, error) {
	uid, ok := UserIDFromContext(ctx)
	if !ok {
		return nil, domain.NewUnauthorizedError("user not authenticated")
	}
	return db.User.Get(ctx, uid)
}

// CurrentUserOrDefault returns the authenticated user or falls back to the default user.
func CurrentUserOrDefault(ctx context.Context, db *ent.Client) (*ent.User, error) {
	if uid, ok := UserIDFromContext(ctx); ok {
		u, err := db.User.Get(ctx, uid)
		if err == nil {
			return u, nil
		}
		if !ent.IsNotFound(err) {
			return nil, err
		}
	}
	return EnsureDefaultUser(ctx, db)
}

// GenerateVerificationCode produces a cryptographically random 6-digit OTP code.
func GenerateVerificationCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", fmt.Errorf("generate verification code: %w", err)
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}
