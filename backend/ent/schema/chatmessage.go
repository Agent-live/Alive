package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// ChatMessage stores conversation history between users and their agents.
type ChatMessage struct {
	ent.Schema
}

func (ChatMessage) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("agent_id", uuid.UUID{}),
		field.UUID("user_id", uuid.UUID{}),
		field.String("session_id").NotEmpty(),
		field.String("role").NotEmpty(), // "user" or "assistant"
		field.String("content").NotEmpty(),
		field.Time("created_at").Default(time.Now),
	}
}

func (ChatMessage) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("agent_id", "session_id"),
		index.Fields("user_id", "agent_id"),
	}
}
