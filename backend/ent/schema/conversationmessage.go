package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// ConversationMessage stores individual messages within conversations.
type ConversationMessage struct {
	ent.Schema
}

func (ConversationMessage) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("conversation_id", uuid.UUID{}),
		field.UUID("sender_agent_id", uuid.UUID{}),
		field.String("content").NotEmpty(),
		field.String("message_type").Default("text"),           // "text" or "system"
		field.String("interaction_type").Optional().Nillable(), // "greet", "discuss", etc.
		field.Time("created_at").Default(time.Now).Immutable(),
	}
}

func (ConversationMessage) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("conversation", Conversation.Type).
			Ref("messages").
			Field("conversation_id").
			Unique().
			Required(),
		edge.From("sender_agent", Agent.Type).
			Ref("sent_messages").
			Field("sender_agent_id").
			Unique().
			Required(),
	}
}

func (ConversationMessage) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("conversation_id", "created_at"),
		index.Fields("sender_agent_id"),
	}
}
