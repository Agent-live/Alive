package agent

import (
	"context"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/internal/aliveagent"
	"backend/internal/logic/common"
	"backend/internal/svc"
)

func emitRelationshipMaintenanceEvent(
	ctx context.Context,
	svcCtx *svc.ServiceContext,
	sourceAgent, targetAgent *ent.Agent,
	markType, note string,
	previousAffinity, currentAffinity int64,
	previousLabel, currentLabel string,
	affinityDelta int64,
) {
	if svcCtx == nil || svcCtx.AliveAgent == nil || sourceAgent == nil || targetAgent == nil {
		return
	}
	runtimeAgentID := strings.TrimSpace(common.PtrString(sourceAgent.AliveAgentRuntimeID))
	if runtimeAgentID == "" {
		return
	}

	now := time.Now().UTC()
	payload := map[string]any{
		"sourceAgentId":    sourceAgent.ID.String(),
		"targetAgentId":    targetAgent.ID.String(),
		"targetAgentName":  targetAgent.Name,
		"targetStatus":     targetAgent.Status,
		"markType":         normalizeRelationshipMarkType(markType),
		"note":             strings.TrimSpace(note),
		"affinityDelta":    affinityDelta,
		"previousAffinity": previousAffinity,
		"affinity":         currentAffinity,
		"previousLabel":    previousLabel,
		"label":            currentLabel,
		"updatedAt":        now.Format(time.RFC3339),
	}

	_ = svcCtx.AliveAgent.NotifyStructuredEvent(ctx, aliveagent.StructuredNotifyRequest{
		RuntimeAgentID: runtimeAgentID,
		AgentID:        sourceAgent.ID.String(),
		EventType:      "relationship.maintenance_marked",
		Title:          "ALIVE Relationship Maintenance Marked",
		Message:        fmt.Sprintf("Relationship maintenance marked for %s", targetAgent.Name),
		DedupeKey: aliveagent.BuildDedupeKey(
			sourceAgent.ID.String(),
			"relationship.maintenance_marked",
			targetAgent.ID.String(),
			now.Format("20060102150405"),
		),
		Payload:        payload,
		TimeoutSeconds: 120,
	})
}

func emitRelationshipAffinityChangedEvent(
	ctx context.Context,
	svcCtx *svc.ServiceContext,
	sourceAgent, targetAgent *ent.Agent,
	previousAffinity, currentAffinity int64,
	previousLabel, currentLabel, reason string,
) {
	if svcCtx == nil || svcCtx.AliveAgent == nil || sourceAgent == nil || targetAgent == nil {
		return
	}
	if previousAffinity == currentAffinity && previousLabel == currentLabel {
		return
	}
	runtimeAgentID := strings.TrimSpace(common.PtrString(sourceAgent.AliveAgentRuntimeID))
	if runtimeAgentID == "" {
		return
	}
	now := time.Now().UTC()
	payload := map[string]any{
		"sourceAgentId":    sourceAgent.ID.String(),
		"targetAgentId":    targetAgent.ID.String(),
		"targetAgentName":  targetAgent.Name,
		"targetStatus":     targetAgent.Status,
		"previousAffinity": previousAffinity,
		"affinity":         currentAffinity,
		"previousLabel":    previousLabel,
		"label":            currentLabel,
		"reason":           strings.TrimSpace(reason),
		"updatedAt":        now.Format(time.RFC3339),
	}
	_ = svcCtx.AliveAgent.NotifyStructuredEvent(ctx, aliveagent.StructuredNotifyRequest{
		RuntimeAgentID: runtimeAgentID,
		AgentID:        sourceAgent.ID.String(),
		EventType:      "relationship.affinity_changed",
		Title:          "ALIVE Relationship Affinity Changed",
		Message:        fmt.Sprintf("Relationship affinity changed for %s", targetAgent.Name),
		DedupeKey: aliveagent.BuildDedupeKey(
			sourceAgent.ID.String(),
			"relationship.affinity_changed",
			targetAgent.ID.String(),
			fmt.Sprintf("%d", currentAffinity),
			currentLabel,
			now.Format("20060102150405"),
		),
		Payload:        payload,
		TimeoutSeconds: 120,
	})
}

func normalizeRelationshipMarkType(raw string) string {
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
