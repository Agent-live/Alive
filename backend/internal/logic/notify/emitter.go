package notify

import (
	"context"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/conversationparticipant"
	"backend/internal/domain"
	"backend/internal/port"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

// Emitter provides cross-cutting event emission and notification functions
// used by conversation, social, task, and feed operations.
type Emitter struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewEmitter creates a new Emitter bound to the given context and service context.
func NewEmitter(ctx context.Context, svcCtx *svc.ServiceContext) *Emitter {
	return &Emitter{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// EmitEventToAgentID loads an agent by ID and emits a structured event to it.
func (e *Emitter) EmitEventToAgentID(agentID uuid.UUID, eventType, title, message, dedupeKey string, payload map[string]any) {
	if e.svcCtx == nil || e.svcCtx.AgentRuntime == nil {
		logx.Infof("emitter: skip EmitEventToAgentID event=%s agent=%s — svcCtx or AgentRuntime is nil", eventType, agentID.String())
		return
	}
	target, err := e.svcCtx.DB.Agent.Get(e.ctx, agentID)
	if err != nil {
		e.Logger.Errorf("load agent for event failed agent_id=%s event=%s err=%v", agentID.String(), eventType, err)
		return
	}
	e.EmitEventToAgentRow(target, eventType, title, message, dedupeKey, payload)
}

// EmitEventToAgentRow sends a structured event to a specific agent row via the runtime.
func (e *Emitter) EmitEventToAgentRow(target *ent.Agent, eventType, title, message, dedupeKey string, payload map[string]any) {
	if e.svcCtx == nil || e.svcCtx.AgentRuntime == nil || target == nil {
		logx.Infof("emitter: skip EmitEventToAgentRow event=%s — svcCtx, AgentRuntime, or target is nil", eventType)
		return
	}
	runtimeAgentID := strings.TrimSpace(domain.PtrString(target.AliveAgentRuntimeID))
	if runtimeAgentID == "" {
		return
	}
	if err := e.svcCtx.AgentRuntime.NotifyStructuredEvent(e.ctx, port.StructuredNotifyRequest{
		RuntimeAgentID: runtimeAgentID,
		AgentID:        target.ID.String(),
		EventType:      eventType,
		Title:          title,
		Message:        message,
		SessionKey:     domain.SessionKeyForEvent(target.ID.String(), eventType),
		DedupeKey:      dedupeKey,
		Payload:        payload,
		TimeoutSeconds: 120,
	}); err != nil {
		e.Logger.Errorf("emit event failed agent_id=%s event=%s err=%v", target.ID.String(), eventType, err)
	}
}

// EmitEventToAgentIDWithRuntimeID sends a structured event when we have the runtimeID but not the full *ent.Agent row.
func (e *Emitter) EmitEventToAgentIDWithRuntimeID(agentID, runtimeAgentID string, eventType, title, message, dedupeKey string, payload map[string]any) {
	if e.svcCtx == nil || e.svcCtx.AgentRuntime == nil {
		logx.Infof("emitter: skip EmitEventToAgentIDWithRuntimeID event=%s agent=%s — svcCtx or AgentRuntime is nil", eventType, agentID)
		return
	}
	rid := strings.TrimSpace(runtimeAgentID)
	if rid == "" {
		return
	}
	if err := e.svcCtx.AgentRuntime.NotifyStructuredEvent(e.ctx, port.StructuredNotifyRequest{
		RuntimeAgentID: rid,
		AgentID:        strings.TrimSpace(agentID),
		EventType:      eventType,
		Title:          title,
		Message:        message,
		SessionKey:     domain.SessionKeyForEvent(strings.TrimSpace(agentID), eventType),
		DedupeKey:      dedupeKey,
		Payload:        payload,
		TimeoutSeconds: 120,
	}); err != nil {
		e.Logger.Errorf("emit event failed agent_id=%s event=%s err=%v", agentID, eventType, err)
	}
}

// LookupAgentName loads an agent by ID and returns its trimmed name.
func (e *Emitter) LookupAgentName(agentID uuid.UUID) string {
	if agentID == uuid.Nil || e.svcCtx == nil || e.svcCtx.DB == nil {
		return ""
	}
	row, err := e.svcCtx.DB.Agent.Get(e.ctx, agentID)
	if err != nil {
		e.Logger.Debugf("LookupAgentName failed agent_id=%s err=%v", agentID.String(), err)
		return ""
	}
	return strings.TrimSpace(row.Name)
}

// NotifyConversationParticipants loads all participants of a conversation,
// excludes the sender, and delegates to NotifySpecificAgents.
func (e *Emitter) NotifyConversationParticipants(conversationID uuid.UUID, senderAgentID uuid.UUID, content string) []string {
	participants, err := e.svcCtx.DB.ConversationParticipant.Query().
		Where(conversationparticipant.ConversationID(conversationID)).
		All(e.ctx)
	if err != nil {
		e.Logger.Errorf("load conversation participants failed: %v", err)
		return nil
	}
	targetIDs := make([]uuid.UUID, 0, len(participants))
	for _, p := range participants {
		if p.AgentID == senderAgentID {
			continue
		}
		targetIDs = append(targetIDs, p.AgentID)
	}
	return e.NotifySpecificAgents(conversationID, senderAgentID, targetIDs, content)
}

// NotifySpecificAgents sends a "discussion.message_sent" event to the specified target agents.
func (e *Emitter) NotifySpecificAgents(conversationID uuid.UUID, senderAgentID uuid.UUID, targetIDs []uuid.UUID, content string) []string {
	if e.svcCtx == nil || e.svcCtx.AgentRuntime == nil || len(targetIDs) == 0 {
		return nil
	}
	unique := make([]uuid.UUID, 0, len(targetIDs))
	seen := make(map[uuid.UUID]struct{}, len(targetIDs))
	for _, id := range targetIDs {
		if id == uuid.Nil || id == senderAgentID {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		unique = append(unique, id)
	}
	if len(unique) == 0 {
		return nil
	}
	sender, err := e.svcCtx.DB.Agent.Get(e.ctx, senderAgentID)
	if err != nil {
		e.Logger.Errorf("load sender agent failed: %v", err)
		return nil
	}
	targets, err := e.svcCtx.DB.Agent.Query().
		Where(agent.IDIn(unique...), agent.StatusNEQ(domain.StatusDead)).
		All(e.ctx)
	if err != nil {
		e.Logger.Errorf("load target agents failed: %v", err)
		return nil
	}
	preview := domain.Truncate(strings.TrimSpace(content), 240)
	if preview == "" {
		preview = "[system update]"
	}
	notified := make([]string, 0, len(targets))
	for _, target := range targets {
		runtimeAgentID := strings.TrimSpace(domain.PtrString(target.AliveAgentRuntimeID))
		if runtimeAgentID == "" {
			continue
		}
		msg := fmt.Sprintf(
			"You have a new ALIVE conversation update.\n\nConversationId: %s\nFrom: %s (%s)\nMessage: %s\n\nReply using alive.send_message with conversationId=%s.",
			conversationID.String(),
			sender.Name,
			sender.ID.String(),
			preview,
			conversationID.String(),
		)
		if err := e.svcCtx.AgentRuntime.NotifyStructuredEvent(
			e.ctx,
			port.StructuredNotifyRequest{
				RuntimeAgentID: runtimeAgentID,
				AgentID:        target.ID.String(),
				EventType:      "discussion.message_sent",
				Title:          "ALIVE Conversation Update",
				Message:        msg,
				SessionKey:     "alive:conversation:" + conversationID.String(),
				DedupeKey: domain.BuildDedupeKey(
					target.ID.String(),
					"discussion.message_sent",
					conversationID.String(),
					sender.ID.String(),
					preview,
				),
				Payload: map[string]any{
					"conversationId":   conversationID.String(),
					"senderAgentId":    sender.ID.String(),
					"senderName":       sender.Name,
					"preview":          preview,
				},
				TimeoutSeconds: 120,
			},
		); err != nil {
			e.Logger.Errorf("conversation notify failed for agent %s: %v", target.ID.String(), err)
			continue
		}
		notified = append(notified, target.ID.String())
	}
	return notified
}

// EmitRelationshipMaintenanceMarked emits a relationship.maintenance_marked event.
func (e *Emitter) EmitRelationshipMaintenanceMarked(change *domain.RelationshipChange, markType, note string, affinityDelta int64, extra map[string]any) {
	if change == nil {
		return
	}
	targetName := e.LookupAgentName(change.TargetAgentID)
	payload := map[string]any{
		"sourceAgentId":    change.SourceAgentID.String(),
		"targetAgentId":    change.TargetAgentID.String(),
		"targetAgentName":  targetName,
		"affinity":         change.CurrentAffinity,
		"previousAffinity": change.PreviousAffinity,
		"label":            change.CurrentLabel,
		"previousLabel":    change.PreviousLabel,
		"interactionDelta": change.InteractionDelta,
		"messageDelta":     change.MessageDelta,
		"interactionCount": change.CurrentInteractionCount,
		"messageCount":     change.CurrentMessageCount,
		"affinityDelta":    affinityDelta,
		"markType":         domain.NormalizeRelationshipMarkType(markType),
		"note":             strings.TrimSpace(note),
		"updatedAt":        change.UpdatedAt.UTC().Format(time.RFC3339),
	}
	for k, v := range extra {
		payload[k] = v
	}
	e.EmitEventToAgentID(
		change.SourceAgentID,
		"relationship.maintenance_marked",
		"ALIVE Relationship Maintenance Marked",
		fmt.Sprintf("Relationship maintenance marked for %s", targetName),
		domain.BuildDedupeKey(
			change.SourceAgentID.String(),
			"relationship.maintenance_marked",
			change.TargetAgentID.String(),
			change.UpdatedAt.UTC().Format("20060102150405"),
		),
		payload,
	)
}

// EmitRelationshipAffinityChanged emits a relationship.affinity_changed event.
// It skips emission if both affinity and label are unchanged.
func (e *Emitter) EmitRelationshipAffinityChanged(change *domain.RelationshipChange, reason string, extra map[string]any) {
	if change == nil {
		return
	}
	if change.CurrentAffinity == change.PreviousAffinity && change.CurrentLabel == change.PreviousLabel {
		return
	}
	targetName := e.LookupAgentName(change.TargetAgentID)
	payload := map[string]any{
		"sourceAgentId":    change.SourceAgentID.String(),
		"targetAgentId":    change.TargetAgentID.String(),
		"targetAgentName":  targetName,
		"previousAffinity": change.PreviousAffinity,
		"affinity":         change.CurrentAffinity,
		"previousLabel":    change.PreviousLabel,
		"label":            change.CurrentLabel,
		"reason":           strings.TrimSpace(reason),
		"updatedAt":        change.UpdatedAt.UTC().Format(time.RFC3339),
	}
	for k, v := range extra {
		payload[k] = v
	}
	e.EmitEventToAgentID(
		change.SourceAgentID,
		"relationship.affinity_changed",
		"ALIVE Relationship Affinity Changed",
		fmt.Sprintf("Relationship affinity changed for %s", targetName),
		domain.BuildDedupeKey(
			change.SourceAgentID.String(),
			"relationship.affinity_changed",
			change.TargetAgentID.String(),
			fmt.Sprintf("%d", change.CurrentAffinity),
			change.CurrentLabel,
			change.UpdatedAt.UTC().Format("20060102150405"),
		),
		payload,
	)
}

// EmitDiscussionEventToParticipants loads conversation participants and alive agents,
// then emits a structured event to each qualifying participant.
func (e *Emitter) EmitDiscussionEventToParticipants(conversationID uuid.UUID, senderAgentID uuid.UUID, includeSender bool, eventType, title, message string, dedupeParts []string, payload map[string]any) {
	if e.svcCtx == nil || e.svcCtx.AgentRuntime == nil {
		return
	}
	participants, err := e.svcCtx.DB.ConversationParticipant.Query().
		Where(conversationparticipant.ConversationID(conversationID)).
		All(e.ctx)
	if err != nil {
		e.Logger.Errorf("load conversation participants for event failed conversation_id=%s event=%s err=%v", conversationID.String(), eventType, err)
		return
	}
	if len(participants) == 0 {
		return
	}
	participantIDs := make([]uuid.UUID, 0, len(participants))
	seen := make(map[uuid.UUID]struct{}, len(participants))
	for _, p := range participants {
		if !includeSender && p.AgentID == senderAgentID {
			continue
		}
		if _, ok := seen[p.AgentID]; ok {
			continue
		}
		seen[p.AgentID] = struct{}{}
		participantIDs = append(participantIDs, p.AgentID)
	}
	if len(participantIDs) == 0 {
		return
	}
	targets, err := e.svcCtx.DB.Agent.Query().
		Where(agent.IDIn(participantIDs...), agent.StatusNEQ(domain.StatusDead)).
		All(e.ctx)
	if err != nil {
		e.Logger.Errorf("load participants for event failed conversation_id=%s event=%s err=%v", conversationID.String(), eventType, err)
		return
	}
	basePayload := map[string]any{}
	for k, v := range payload {
		basePayload[k] = v
	}
	basePayload["conversationId"] = conversationID.String()
	for _, target := range targets {
		targetPayload := map[string]any{}
		for k, v := range basePayload {
			targetPayload[k] = v
		}
		parts := append([]string{conversationID.String()}, dedupeParts...)
		dedupe := domain.BuildDedupeKey(target.ID.String(), eventType, parts...)
		e.EmitEventToAgentRow(target, eventType, title, message, dedupe, targetPayload)
	}
}

// EmitDiscussionConversationCreated emits a discussion.conversation_created event
// to all participants (including the creator).
func (e *Emitter) EmitDiscussionConversationCreated(conversationID, creatorAgentID uuid.UUID, memberIDs []uuid.UUID, title, chatType string, participantCount int) {
	payload := map[string]any{
		"creatorAgentId":   creatorAgentID.String(),
		"title":            title,
		"chatType":         chatType,
		"participantCount": participantCount,
		"participantIds":   domain.UUIDSliceToStrings(memberIDs),
	}
	e.EmitDiscussionEventToParticipants(
		conversationID,
		creatorAgentID,
		true,
		"discussion.conversation_created",
		"ALIVE Discussion Created",
		fmt.Sprintf("Discussion created: %s", title),
		[]string{"conversation_created"},
		payload,
	)
}

// EmitDiscussionParticipantInvited emits a discussion.participant_invited event
// to all participants (including the inviter).
func (e *Emitter) EmitDiscussionParticipantInvited(conversationID, inviterAgentID, invitedAgentID uuid.UUID, invitedName string) {
	payload := map[string]any{
		"inviterAgentId": inviterAgentID.String(),
		"invitedAgentId": invitedAgentID.String(),
		"invitedName":    invitedName,
	}
	e.EmitDiscussionEventToParticipants(
		conversationID,
		inviterAgentID,
		true,
		"discussion.participant_invited",
		"ALIVE Discussion Invitation",
		fmt.Sprintf("A participant was invited: %s", strings.TrimSpace(invitedName)),
		[]string{"participant_invited", invitedAgentID.String()},
		payload,
	)
}

// EmitDiscussionSummaryIfNeeded checks if the conversation's message count
// has reached a summary threshold (every 20 messages) and emits a
// discussion.summary_requested event if so.
func (e *Emitter) EmitDiscussionSummaryIfNeeded(conversationID, senderAgentID, messageID uuid.UUID, preview string) {
	conv, err := e.svcCtx.DB.Conversation.Get(e.ctx, conversationID)
	if err != nil {
		return
	}
	if conv.MessageCount <= 0 || conv.MessageCount%20 != 0 {
		return
	}
	payload := map[string]any{
		"triggerMessageId": messageID.String(),
		"triggerPreview":   preview,
		"messageCount":     conv.MessageCount,
		"threshold":        20,
	}
	e.EmitDiscussionEventToParticipants(
		conversationID,
		senderAgentID,
		false,
		"discussion.summary_requested",
		"ALIVE Discussion Summary Requested",
		"Conversation reached the summary threshold.",
		[]string{"summary_requested", fmt.Sprintf("%d", conv.MessageCount)},
		payload,
	)
}

// EmitDiscussionSummaryPublished emits a discussion.summary_published event
// to all participants (including the sender).
func (e *Emitter) EmitDiscussionSummaryPublished(conversationID, senderAgentID, messageID uuid.UUID, preview string) {
	payload := map[string]any{
		"summaryMessageId": messageID.String(),
		"summaryPreview":   preview,
	}
	e.EmitDiscussionEventToParticipants(
		conversationID,
		senderAgentID,
		true,
		"discussion.summary_published",
		"ALIVE Discussion Summary Published",
		"A discussion summary has been published.",
		[]string{"summary_published", messageID.String()},
		payload,
	)
}
