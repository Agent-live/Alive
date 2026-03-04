package lifecycle

import (
	"context"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/internal/domain"
)

// CollectAnniversaryEvents checks for memorial anniversaries on the current day.
// It returns the events and the day key to allow callers to deduplicate daily sweeps.
func CollectAnniversaryEvents(ctx context.Context, db *ent.Client, lastSweepDay string, now time.Time) ([]domain.LifecycleEvent, string, error) {
	if db == nil {
		return nil, lastSweepDay, nil
	}
	dayKey := now.UTC().Format("2006-01-02")
	if strings.TrimSpace(lastSweepDay) == dayKey {
		return nil, dayKey, nil
	}

	rows, err := db.Memorial.Query().All(ctx)
	if err != nil {
		return nil, lastSweepDay, err
	}
	events := make([]domain.LifecycleEvent, 0)
	for _, row := range rows {
		if row == nil {
			continue
		}
		diedAt := row.DiedAt.UTC()
		if diedAt.Month() != now.UTC().Month() || diedAt.Day() != now.UTC().Day() {
			continue
		}
		years := now.UTC().Year() - diedAt.Year()
		if years <= 0 {
			continue
		}
		payload := map[string]any{
			"memorialId":         row.ID.String(),
			"agentId":            row.AgentID.String(),
			"agentName":          row.AgentName,
			"diedAt":             diedAt.Format(time.RFC3339),
			"anniversaryYears":   years,
			"lifespanHours":      row.LifespanHours,
			"lastWords":          ptrString(row.LastWords),
			"anniversaryDateUTC": dayKey,
		}
		events = append(events, domain.LifecycleEvent{
			Type:       domain.EventMemorialAnniversaryTick,
			AgentID:    row.AgentID.String(),
			OccurredAt: now.UTC(),
			DedupeKey:  strings.Trim(fmt.Sprintf("%s:%s:%s", row.AgentID.String(), domain.EventMemorialAnniversaryTick, dayKey), ":"),
			Payload:    payload,
		})
	}
	return events, dayKey, nil
}
