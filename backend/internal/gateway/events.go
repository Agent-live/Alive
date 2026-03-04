package gateway

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/domain"
	"backend/internal/port"

	"github.com/zeromicro/go-zero/core/logx"
)

// NotifyStructuredEvent sends a canonical ALIVE event envelope to AliveAgent.
func (c *Client) NotifyStructuredEvent(ctx context.Context, req port.StructuredNotifyRequest) error {
	runtimeAgentID := strings.TrimSpace(req.RuntimeAgentID)
	if runtimeAgentID == "" {
		return fmt.Errorf("runtime agent id is required")
	}

	agentID := strings.TrimSpace(req.AgentID)
	if agentID == "" {
		agentID = runtimeAgentID
	}
	eventType := strings.TrimSpace(req.EventType)
	if eventType == "" {
		eventType = "notification.generic"
	}
	sessionKey := strings.TrimSpace(req.SessionKey)
	if sessionKey == "" {
		sessionKey = domain.SessionKeyForEvent(agentID, eventType)
	}

	title := strings.TrimSpace(req.Title)
	if title == "" {
		title = "ALIVE Event"
	}
	message := strings.TrimSpace(req.Message)
	if message == "" {
		message = title
	}

	envelope := domain.BuildEventEnvelope(agentID, eventType, sessionKey, req.DedupeKey, req.Payload)

	logx.WithContext(ctx).Infof("[gateway] NotifyStructuredEvent: agentID=%s runtimeAgentID=%s eventType=%s", agentID, runtimeAgentID, eventType)
	err := c.NotifyAgent(ctx, NotifyAgentRequest{
		AgentID:        runtimeAgentID,
		SessionKey:     sessionKey,
		Title:          title,
		Message:        message,
		EventSource:    domain.SourceForEventType(eventType),
		EventType:      eventType,
		Payload:        envelope,
		TimeoutSeconds: req.TimeoutSeconds,
	})
	if err != nil {
		logx.WithContext(ctx).Errorf("[gateway] NotifyStructuredEvent failed: agentID=%s eventType=%s err=%v", agentID, eventType, err)
	}
	return err
}
