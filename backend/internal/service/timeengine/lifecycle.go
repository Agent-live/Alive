package timeengine

import (
	"errors"
	"strings"
	"time"

	"backend/ent"
	"backend/internal/domain"

	"github.com/google/uuid"
)

func deriveStatus(now time.Time, bornAt time.Time, timerRemaining int64, isNative bool) string {
	if timerRemaining <= 0 {
		return domain.StatusDead
	}
	if isNative {
		return domain.StatusAlive
	}

	ageHours := now.Sub(bornAt).Hours()
	if ageHours < 6 {
		return domain.StatusNewborn
	}

	switch {
	case timerRemaining < domain.ThresholdCritical:
		return domain.StatusCritical
	case timerRemaining < domain.ThresholdDying:
		return domain.StatusDying
	case timerRemaining < domain.ThresholdLow:
		return domain.StatusLow
	case timerRemaining < domain.ThresholdComfortable:
		return domain.StatusComfortable
	default:
		return domain.StatusAlive
	}
}

func isDeadAgent(a *ent.Agent) bool {
	if a == nil {
		return true
	}
	if a.DiedAt != nil {
		return true
	}
	if strings.EqualFold(strings.TrimSpace(a.Status), domain.StatusDead) {
		return true
	}
	return a.TimerRemaining <= 0
}

func diedAtOr(a *ent.Agent, fallback time.Time) time.Time {
	if a != nil && a.DiedAt != nil {
		return a.DiedAt.UTC()
	}
	return fallback.UTC()
}

func defaultIfEmpty(v, fallback string) string {
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}

func parseUUID(raw string) (uuid.UUID, error) {
	id, err := uuid.Parse(strings.TrimSpace(raw))
	if err != nil {
		return uuid.Nil, errors.New("invalid id")
	}
	return id, nil
}

func ptrString(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}
