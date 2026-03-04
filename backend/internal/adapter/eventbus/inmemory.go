package eventbus

import (
	"context"
	"sync"
	"time"

	"backend/internal/port"

	"github.com/zeromicro/go-zero/core/logx"
)

// InMemoryBus is an in-process event bus that dispatches events asynchronously.
type InMemoryBus struct {
	mu       sync.RWMutex
	handlers map[string][]port.EventHandler // eventType → handlers
	wildcard []port.EventHandler            // handlers for all events
}

const (
	handlerRetryMaxAttempts = 3
	handlerRetryBaseBackoff = 20 * time.Millisecond
)

var _ port.EventBus = (*InMemoryBus)(nil)

// NewInMemoryBus creates a new in-memory event bus.
func NewInMemoryBus() *InMemoryBus {
	return &InMemoryBus{
		handlers: make(map[string][]port.EventHandler),
	}
}

// Publish dispatches an event to all matching subscribers asynchronously.
func (b *InMemoryBus) Publish(_ context.Context, event port.DomainEvent) error {
	b.mu.RLock()
	typed := b.handlers[event.Type]
	wild := b.wildcard
	b.mu.RUnlock()

	for _, h := range typed {
		handler := h
		go func() {
			dispatchWithRetry(event.Type, handler, event)
		}()
	}
	for _, h := range wild {
		handler := h
		go func() {
			dispatchWithRetry(event.Type, handler, event)
		}()
	}
	return nil
}

// Subscribe registers a handler for a specific event type.
// Use "*" to subscribe to all events.
func (b *InMemoryBus) Subscribe(eventType string, handler port.EventHandler) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if eventType == "*" {
		b.wildcard = append(b.wildcard, handler)
	} else {
		b.handlers[eventType] = append(b.handlers[eventType], handler)
	}
}

func dispatchWithRetry(eventType string, handler port.EventHandler, event port.DomainEvent) {
	for attempt := 1; attempt <= handlerRetryMaxAttempts; attempt++ {
		panicked := false
		func() {
			defer func() {
				if r := recover(); r != nil {
					panicked = true
					logx.Errorf("[eventbus] handler panic for event %s (attempt %d/%d): %v", eventType, attempt, handlerRetryMaxAttempts, r)
				}
			}()
			handler(context.Background(), event)
		}()
		if !panicked {
			return
		}
		if attempt < handlerRetryMaxAttempts {
			time.Sleep(time.Duration(attempt) * handlerRetryBaseBackoff)
		}
	}
	logx.Errorf("[eventbus] handler dropped after retries for event %s", eventType)
}
