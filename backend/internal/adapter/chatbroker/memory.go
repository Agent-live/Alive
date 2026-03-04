package chatbroker

import (
	"sync"

	"backend/internal/port"
)

// MemoryBroker is an in-process chat broker implementation used for local/dev.
type MemoryBroker struct {
	mu      sync.Mutex
	pending map[string]pendingEntry
	streams map[string]streamEntry
}

type pendingEntry struct {
	ownerAgentID string
	ch           chan port.ReplyMessage
}

type streamEntry struct {
	ownerAgentID string
	ch           chan port.StreamChunk
}

// NewMemoryBroker builds a new in-memory broker.
func NewMemoryBroker() *MemoryBroker {
	return &MemoryBroker{
		pending: make(map[string]pendingEntry),
		streams: make(map[string]streamEntry),
	}
}

// RegisterPending creates and registers a pending reply channel for requestID.
func (b *MemoryBroker) RegisterPending(requestID string, ownerAgentID string) <-chan port.ReplyMessage {
	ch := make(chan port.ReplyMessage, 1)
	b.mu.Lock()
	b.pending[requestID] = pendingEntry{ownerAgentID: ownerAgentID, ch: ch}
	b.mu.Unlock()
	return ch
}

// UnregisterPending removes the pending reply channel for requestID.
func (b *MemoryBroker) UnregisterPending(requestID string) {
	b.mu.Lock()
	delete(b.pending, requestID)
	b.mu.Unlock()
}

// Deliver routes a full reply to a pending request.
func (b *MemoryBroker) Deliver(requestID string, ownerAgentID string, msg port.ReplyMessage) bool {
	b.mu.Lock()
	entry, ok := b.pending[requestID]
	b.mu.Unlock()
	if !ok || entry.ownerAgentID != ownerAgentID {
		return false
	}
	select {
	case entry.ch <- msg:
		return true
	default:
		return false
	}
}

// OpenStream creates a streaming channel for requestID.
func (b *MemoryBroker) OpenStream(requestID string, ownerAgentID string) <-chan port.StreamChunk {
	ch := make(chan port.StreamChunk, 64)
	b.mu.Lock()
	b.streams[requestID] = streamEntry{ownerAgentID: ownerAgentID, ch: ch}
	b.mu.Unlock()
	return ch
}

// CloseStream removes and closes the stream channel for requestID.
func (b *MemoryBroker) CloseStream(requestID string) {
	b.mu.Lock()
	entry, ok := b.streams[requestID]
	delete(b.streams, requestID)
	b.mu.Unlock()
	if ok {
		close(entry.ch)
	}
}

// DeliverChunk routes one stream token chunk to an open request stream.
func (b *MemoryBroker) DeliverChunk(requestID string, ownerAgentID string, chunk port.StreamChunk) bool {
	b.mu.Lock()
	entry, ok := b.streams[requestID]
	b.mu.Unlock()
	if !ok || entry.ownerAgentID != ownerAgentID {
		return false
	}
	defer func() {
		// closed channel during concurrent CloseStream
		_ = recover()
	}()
	select {
	case entry.ch <- chunk:
		return true
	default:
		return false
	}
}
