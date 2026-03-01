package skill

import (
	"errors"
	"strings"

	"github.com/google/uuid"
)

func parseSkillID(raw string) (uuid.UUID, error) {
	id, err := uuid.Parse(strings.TrimSpace(raw))
	if err != nil {
		return uuid.Nil, errors.New("invalid skill id")
	}
	return id, nil
}

func parseOptionalAgentID(raw string) (*uuid.UUID, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return nil, nil
	}
	id, err := uuid.Parse(value)
	if err != nil {
		return nil, errors.New("invalid agent id")
	}
	return &id, nil
}

func normalizeSkillCategory(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "creative", "analytical", "social", "technical":
		return strings.ToLower(strings.TrimSpace(raw))
	default:
		return "other"
	}
}

func normalizeSkillStatus(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "lesson", "active", "rejected":
		return strings.ToLower(strings.TrimSpace(raw))
	default:
		return ""
	}
}

func normalizeSkillReviewAction(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "approve", "approved":
		return "approve"
	case "reject", "rejected":
		return "reject"
	default:
		return ""
	}
}
