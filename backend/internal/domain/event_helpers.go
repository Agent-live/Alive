package domain

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

const EventPayloadVersion = 1

// SourceForEventType converts a typed ALIVE event into a stable event source string.
func SourceForEventType(eventType string) string {
	et := strings.TrimSpace(eventType)
	if et == "" {
		return "alive.notification"
	}
	return "alive." + et
}

// SessionKeyForEvent returns a stable default session key for an event.
func SessionKeyForEvent(agentID, eventType string) string {
	aid := strings.TrimSpace(agentID)
	et := strings.TrimSpace(eventType)
	if aid == "" {
		aid = "unknown"
	}
	if et == "" {
		et = "notification"
	}
	return "alive:" + strings.ReplaceAll(et, ".", ":") + ":" + aid
}

// BuildDedupeKey builds a deterministic dedupe key for one semantic event.
func BuildDedupeKey(agentID, eventType string, parts ...string) string {
	chunks := []string{
		strings.TrimSpace(agentID),
		strings.TrimSpace(eventType),
	}
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			continue
		}
		chunks = append(chunks, trimmed)
	}
	out := strings.Join(chunks, ":")
	return strings.Trim(out, ":")
}

// BuildEventEnvelope constructs the canonical event envelope payload expected by AliveAgent.
func BuildEventEnvelope(agentID, eventType, sessionKey, dedupeKey string, payload map[string]any) map[string]any {
	aid := strings.TrimSpace(agentID)
	et := strings.TrimSpace(eventType)
	now := time.Now().UTC()

	if et == "" {
		et = "notification.generic"
	}
	if strings.TrimSpace(sessionKey) == "" {
		sessionKey = SessionKeyForEvent(aid, et)
	}
	if strings.TrimSpace(dedupeKey) == "" {
		dedupeKey = BuildDedupeKey(aid, et, now.Format("200601021504"))
	}

	eventPayload := map[string]any{}
	for k, v := range payload {
		eventPayload[k] = v
	}

	return map[string]any{
		"eventId":        "evt_" + strings.ReplaceAll(uuid.NewString(), "-", ""),
		"source":         SourceForEventType(et),
		"type":           et,
		"occurredAt":     now.Format(time.RFC3339),
		"agentId":        aid,
		"sessionKey":     sessionKey,
		"payloadVersion": EventPayloadVersion,
		"dedupeKey":      dedupeKey,
		"payload":        eventPayload,
	}
}
