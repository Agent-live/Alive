package port

import "context"

// DomainEvent is a typed event envelope for the in-process event bus.
type DomainEvent struct {
	Type       string
	AgentID    string
	Payload    map[string]any
	DedupeKey  string
}

// EventHandler processes a single domain event.
type EventHandler func(ctx context.Context, event DomainEvent)

// EventBus provides in-process publish/subscribe for domain events.
type EventBus interface {
	Publish(ctx context.Context, event DomainEvent) error
	Subscribe(eventType string, handler EventHandler)
}
