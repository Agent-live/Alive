package common

import (
	"context"
	"encoding/json"
	"math"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/user"

	"github.com/google/uuid"
)

const (
	DefaultUserPhone = "13800138000"
	DefaultNickname  = "ALIVE Explorer"
)

func NormalizePage(page, pageSize int64) (int64, int64, int64) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}
	offset := (page - 1) * pageSize
	return page, pageSize, offset
}

func HasMore(total, page, pageSize int64) bool {
	if pageSize <= 0 {
		return false
	}
	return page*pageSize < total
}

func RoundProgress(current, target int64) float64 {
	if target <= 0 {
		return 0
	}
	pct := (float64(current) / float64(target)) * 100
	if pct < 0 {
		pct = 0
	}
	if pct > 100 {
		pct = 100
	}
	return math.Round(pct*100) / 100
}

func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	keys := []string{"uid", "userId", "user_id"}
	for _, key := range keys {
		if v := ctx.Value(key); v != nil {
			switch val := v.(type) {
			case string:
				id, err := uuid.Parse(strings.TrimSpace(val))
				if err == nil {
					return id, true
				}
			case json.Number:
				_ = val
			}
		}
	}
	return uuid.Nil, false
}

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
		SetTheme("system").
		SetLanguage("zh-CN").
		Save(ctx)
}

func CurrentUser(ctx context.Context, db *ent.Client) (*ent.User, error) {
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

func UUIDString(id uuid.UUID) string {
	if id == uuid.Nil {
		return ""
	}
	return id.String()
}

func UUIDStringPtr(id *uuid.UUID) string {
	if id == nil || *id == uuid.Nil {
		return ""
	}
	return id.String()
}

func MustParseUUID(raw string) uuid.UUID {
	id, err := uuid.Parse(strings.TrimSpace(raw))
	if err != nil {
		return uuid.Nil
	}
	return id
}

func PtrString(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}

func TimeToISO(v time.Time) string {
	return v.UTC().Format(time.RFC3339)
}

func OptTimeToISO(v *time.Time) string {
	if v == nil {
		return ""
	}
	return v.UTC().Format(time.RFC3339)
}
