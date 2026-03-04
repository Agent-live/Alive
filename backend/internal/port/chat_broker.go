package port

// ReplyMessage carries a complete assistant reply for one chat request.
type ReplyMessage struct {
	Reply string
}

// StreamChunk carries one incremental token chunk for streaming chat replies.
type StreamChunk struct {
	Token string
	Done  bool
}

// ChatBroker pairs pending chat requests with MCP tool callbacks.
type ChatBroker interface {
	RegisterPending(requestID string, ownerAgentID string) <-chan ReplyMessage
	UnregisterPending(requestID string)
	OpenStream(requestID string, ownerAgentID string) <-chan StreamChunk
	CloseStream(requestID string)
	Deliver(requestID string, ownerAgentID string, msg ReplyMessage) bool
	DeliverChunk(requestID string, ownerAgentID string, chunk StreamChunk) bool
}
