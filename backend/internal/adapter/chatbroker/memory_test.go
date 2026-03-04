package chatbroker

import (
	"sync"
	"testing"
	"time"

	"backend/internal/port"
)

func TestMemoryBrokerRegisterAndDeliverPending(t *testing.T) {
	b := NewMemoryBroker()
	reqID := "req-1"
	owner := "agent-1"

	replyCh := b.RegisterPending(reqID, owner)
	if ok := b.Deliver(reqID, owner, port.ReplyMessage{Reply: "hello"}); !ok {
		t.Fatalf("expected deliver to succeed")
	}

	select {
	case msg := <-replyCh:
		if msg.Reply != "hello" {
			t.Fatalf("unexpected reply: %q", msg.Reply)
		}
	case <-time.After(200 * time.Millisecond):
		t.Fatalf("timed out waiting reply")
	}
}

func TestMemoryBrokerCloseStreamThenDeliverReturnsFalse(t *testing.T) {
	b := NewMemoryBroker()
	reqID := "req-stream-close"
	owner := "agent-1"

	streamCh := b.OpenStream(reqID, owner)
	if ok := b.DeliverChunk(reqID, owner, port.StreamChunk{Token: "a"}); !ok {
		t.Fatalf("expected first stream chunk delivery to succeed")
	}
	select {
	case <-streamCh:
	case <-time.After(200 * time.Millisecond):
		t.Fatalf("timed out waiting first stream chunk")
	}

	b.CloseStream(reqID)
	if ok := b.DeliverChunk(reqID, owner, port.StreamChunk{Token: "b"}); ok {
		t.Fatalf("expected stream delivery to fail after close")
	}
}

func TestMemoryBrokerConcurrentCloseAndDeliverNoPanic(t *testing.T) {
	b := NewMemoryBroker()
	reqID := "req-race"
	owner := "agent-1"
	_ = b.OpenStream(reqID, owner)

	var wg sync.WaitGroup
	for i := 0; i < 200; i++ {
		wg.Add(2)
		go func() {
			defer wg.Done()
			_ = b.DeliverChunk(reqID, owner, port.StreamChunk{Token: "x"})
		}()
		go func() {
			defer wg.Done()
			b.CloseStream(reqID)
		}()
	}
	wg.Wait()
}

func TestMemoryBrokerRejectsWrongOwner(t *testing.T) {
	b := NewMemoryBroker()
	reqID := "req-owner"
	replyCh := b.RegisterPending(reqID, "agent-a")
	defer b.UnregisterPending(reqID)

	if ok := b.Deliver(reqID, "agent-b", port.ReplyMessage{Reply: "intrude"}); ok {
		t.Fatalf("expected deliver to fail for wrong owner")
	}
	select {
	case <-replyCh:
		t.Fatalf("unexpected message delivered for wrong owner")
	case <-time.After(50 * time.Millisecond):
	}
}
