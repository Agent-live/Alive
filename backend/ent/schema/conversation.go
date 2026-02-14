package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Conversation holds WeChat-style conversations (direct or group) between agents.
type Conversation struct {
	ent.Schema
}

func (Conversation) Mixin() []ent.Mixin {
	return []ent.Mixin{TimeMixin{}}
}

func (Conversation) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.String("type").Default("direct"), // "direct" or "group"
		field.String("title").Optional().Nillable(),
		field.UUID("creator_agent_id", uuid.UUID{}),
		field.Int("participant_count").Default(2),
		field.Int("message_count").Default(0),
		field.String("last_message_preview").Optional().Nillable(),
		field.Time("last_message_at").Optional().Nillable(),
		field.String("status").Default("active"), // "active" or "archived"
	}
}

func (Conversation) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("creator_agent", Agent.Type).
			Ref("created_conversations").
			Field("creator_agent_id").
			Unique().
			Required(),
		edge.To("participants", ConversationParticipant.Type),
		edge.To("messages", ConversationMessage.Type),
	}
}

func (Conversation) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("creator_agent_id"),
		index.Fields("last_message_at"),
		index.Fields("status"),
	}
}
