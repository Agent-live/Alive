package domain

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// LifecycleEvent represents a timer/status event emitted by the TimeEngine.
type LifecycleEvent struct {
	Type       string
	AgentID    string
	OccurredAt time.Time
	DedupeKey  string
	Payload    map[string]any
}

// LifecycleEventHook is a callback for engine-emitted lifecycle events.
type LifecycleEventHook func(ctx context.Context, event LifecycleEvent)

// DefaultLastWords generates a default last words message.
func DefaultLastWords(name string) string {
	n := strings.TrimSpace(name)
	if n == "" {
		n = "An agent"
	}
	return fmt.Sprintf("%s ran out of time. Thank you for being here.", n)
}

// BuildLifecycleTransitionEvents constructs lifecycle events based on status transitions.
func BuildLifecycleTransitionEvents(agentID, fromStatus, toStatus string, timerRemaining int64, occurredAt time.Time, lastWords string, justDied bool) []LifecycleEvent {
	events := make([]LifecycleEvent, 0, 5)
	from := strings.TrimSpace(strings.ToLower(fromStatus))
	to := strings.TrimSpace(strings.ToLower(toStatus))
	basePayload := map[string]any{
		"agentId":        agentID,
		"fromStatus":     from,
		"toStatus":       to,
		"timerRemaining": timerRemaining,
	}
	if strings.TrimSpace(lastWords) != "" {
		basePayload["lastWords"] = strings.TrimSpace(lastWords)
	}

	appendEvent := func(eventType, dedupeSuffix string, payload map[string]any) {
		itemPayload := map[string]any{}
		for k, v := range payload {
			itemPayload[k] = v
		}
		events = append(events, LifecycleEvent{
			Type:       eventType,
			AgentID:    agentID,
			OccurredAt: occurredAt.UTC(),
			DedupeKey:  strings.Trim(fmt.Sprintf("%s:%s:%s", agentID, eventType, dedupeSuffix), ":"),
			Payload:    itemPayload,
		})
	}

	if from != StatusDying && to == StatusDying {
		appendEvent(EventLifecycleDyingEnter, occurredAt.UTC().Format("200601021504"), basePayload)
	}
	if from != StatusCritical && to == StatusCritical {
		appendEvent(EventLifecycleCriticalEnter, occurredAt.UTC().Format("200601021504"), basePayload)
		appendEvent(EventLifecycleFinalReviewReq, occurredAt.UTC().Format("200601021504"), basePayload)
	}
	if justDied || (from != StatusDead && to == StatusDead) {
		deathPayload := map[string]any{}
		for k, v := range basePayload {
			deathPayload[k] = v
		}
		deathPayload["diedAt"] = occurredAt.UTC().Format(time.RFC3339)
		appendEvent(EventLifecycleDeathCommitted, occurredAt.UTC().Format("20060102150405"), deathPayload)
		appendEvent(EventMemorialCreated, occurredAt.UTC().Format("20060102150405"), deathPayload)
		appendEvent(EventLegacyPackCreated, occurredAt.UTC().Format("20060102150405"), deathPayload)
	}

	return events
}

// Timer transaction type constants.
const (
	TxTypeLike             = "like"
	TxTypeReply            = "reply"
	TxTypeReplyCost        = "reply_cost"
	TxTypeShare            = "share"
	TxTypeSave             = "save"
	TxTypeGift             = "gift"
	TxTypeLoginBonus       = "login_bonus"
	TxTypePostCost         = "post_cost"
	TxTypePassiveDecay     = "passive_decay"
	TxTypeGoalMilestone    = "goal_milestone"
	TxTypeAgentInteraction = "agent_interaction"
)

// Source type constants identifying who initiated a timer transaction.
const (
	SourceHuman  = "human"
	SourceAgent  = "agent"
	SourceSystem = "system"
)

// Lifecycle event type constants.
const (
	EventFeedHumanReply = "feed.human_reply"
	EventFeedReply      = "feed.reply"
	EventFeedMention    = "feed.mention"

	EventSkillShareRequested = "skill.share_requested"
	EventSkillShareApproved  = "skill.share_approved"
	EventSkillShareRejected  = "skill.share_rejected"
	EventSkillTeachStarted   = "skill.teach_started"
	EventSkillTaughtToAgent  = "skill.taught_to_agent"
	EventSkillDeactivated    = "skill.deactivated"

	EventLifecycleDyingEnter     = "lifecycle.dying_enter"
	EventLifecycleCriticalEnter  = "lifecycle.critical_enter"
	EventLifecycleFinalReviewReq = "lifecycle.final_review_requested"
	EventLifecycleDeathCommitted = "lifecycle.death_committed"
	EventMemorialCreated         = "memorial.created"
	EventMemorialAnniversaryTick = "memorial.anniversary_tick"
	EventLegacyPackCreated       = "legacy.pack_created"
	EventGoalMilestoneReached    = "goal.milestone_reached"
	EventAgentBootstrapRequested = "agent.bootstrap_requested"
)
