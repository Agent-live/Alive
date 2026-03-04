package domain

import (
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
)

// PtrString dereferences a *string, returning "" for nil.
func PtrString(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}

// TimeToISO formats a time.Time as UTC RFC3339.
func TimeToISO(v time.Time) string {
	return v.UTC().Format(time.RFC3339)
}

// OptTimeToISO formats an optional time.Time as UTC RFC3339, returning "" for nil.
func OptTimeToISO(v *time.Time) string {
	if v == nil {
		return ""
	}
	return v.UTC().Format(time.RFC3339)
}

// UUIDString returns the string representation of a UUID, or "" for uuid.Nil.
func UUIDString(id uuid.UUID) string {
	if id == uuid.Nil {
		return ""
	}
	return id.String()
}

// UUIDStringPtr returns the string representation of a *UUID, or "" for nil/Nil.
func UUIDStringPtr(id *uuid.UUID) string {
	if id == nil || *id == uuid.Nil {
		return ""
	}
	return id.String()
}

// ParseUUID parses a trimmed UUID string.
func ParseUUID(raw string) (uuid.UUID, error) {
	return uuid.Parse(strings.TrimSpace(raw))
}

// MustParseUUID parses a UUID string, returning uuid.Nil on error.
func MustParseUUID(raw string) uuid.UUID {
	id, err := uuid.Parse(strings.TrimSpace(raw))
	if err != nil {
		return uuid.Nil
	}
	return id
}

// RoundProgress computes a 0–100 percentage rounded to 2 decimal places.
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

// NormalizePage clamps page/pageSize and returns (page, pageSize, offset).
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

// HasMore returns true if there are more pages.
func HasMore(total, page, pageSize int64) bool {
	if pageSize <= 0 {
		return false
	}
	return page*pageSize < total
}

// FallbackString returns the trimmed value, or the fallback if the value is empty.
func FallbackString(value, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}
	return trimmed
}

// TrimUnique deduplicates and trims a string slice (case-insensitive).
func TrimUnique(values []string) []string {
	out := make([]string, 0, len(values))
	seen := map[string]struct{}{}
	for _, value := range values {
		tag := strings.TrimSpace(value)
		if tag == "" {
			continue
		}
		key := strings.ToLower(tag)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, tag)
	}
	return out
}

// TrimNonEmpty trims whitespace from each element and removes empty entries.
func TrimNonEmpty(values []string) []string {
	out := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		out = append(out, trimmed)
	}
	return out
}

// FormatTimerHuman converts timer units (1 unit = 10 minutes) to "Xh Ym" format.
func FormatTimerHuman(units int64) string {
	if units <= 0 {
		return "0m"
	}
	totalMinutes := units * 10
	hours := totalMinutes / 60
	minutes := totalMinutes % 60
	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	}
	return fmt.Sprintf("%dm", minutes)
}

// Truncate returns the first maxLen runes of s, appending nothing.
func Truncate(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}
	return string(runes[:maxLen])
}

// ExtractBlocksText extracts plain text from content blocks.
func ExtractBlocksText(blocks []map[string]any) string {
	var parts []string
	for _, b := range blocks {
		bType, _ := b["type"].(string)
		if bType == ContentBlockTypeText {
			if val, _ := b["value"].(string); strings.TrimSpace(val) != "" {
				parts = append(parts, strings.TrimSpace(val))
			} else if text, _ := b["text"].(string); strings.TrimSpace(text) != "" {
				parts = append(parts, strings.TrimSpace(text))
			}
		}
	}
	return strings.Join(parts, "\n")
}

// AffinityLabel returns the relationship label based on cumulative affinity.
func AffinityLabel(affinity int64) string {
	switch {
	case affinity >= 15:
		return RelationshipLabelCloseFriend
	case affinity >= 5:
		return RelationshipLabelFriend
	default:
		return RelationshipLabelAcquaintance
	}
}

// NormalizeRelationshipMarkType normalizes relationship mark type strings.
func NormalizeRelationshipMarkType(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "follow":
		return "follow"
	case "unfollow":
		return "unfollow"
	case "check_in", "checkin":
		return "check_in"
	case "follow_up", "followup":
		return "follow_up"
	case "support":
		return "support"
	case "memory":
		return "memory"
	case "interaction":
		return "interaction"
	default:
		return "check_in"
	}
}

// UUIDSliceToStrings converts a slice of UUIDs to strings, skipping uuid.Nil.
func UUIDSliceToStrings(ids []uuid.UUID) []string {
	if len(ids) == 0 {
		return nil
	}
	out := make([]string, 0, len(ids))
	for _, id := range ids {
		if id == uuid.Nil {
			continue
		}
		out = append(out, id.String())
	}
	return out
}

// AsString converts any value to a string. Strings are returned as-is,
// nil returns "", and everything else is JSON-marshalled with surrounding
// quotes stripped.
func AsString(v any) string {
	if v == nil {
		return ""
	}
	switch value := v.(type) {
	case string:
		return value
	default:
		raw, _ := json.Marshal(value)
		return strings.Trim(string(raw), "\"")
	}
}

// RelationshipChange tracks the before/after state of a relationship mutation.
type RelationshipChange struct {
	SourceAgentID            uuid.UUID
	TargetAgentID            uuid.UUID
	PreviousAffinity         int64
	CurrentAffinity          int64
	PreviousLabel            string
	CurrentLabel             string
	InteractionDelta         int64
	MessageDelta             int64
	PreviousInteractionCount int64
	CurrentInteractionCount  int64
	PreviousMessageCount     int64
	CurrentMessageCount      int64
	UpdatedAt                time.Time
}
