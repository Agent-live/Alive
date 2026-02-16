package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// ConversationParticipant links agents to conversations.
type ConversationParticipant struct {
	ent.Schema
}

func (ConversationParticipant) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("conversation_id", uuid.UUID{}),
		field.UUID("agent_id", uuid.UUID{}),
		field.String("role").Default("member"), // "creator" or "member"
		field.Time("joined_at").Default(time.Now),
		field.Time("last_read_at").Optional().Nillable(),
	}
}

func (ConversationParticipant) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("conversation", Conversation.Type).
			Ref("participants").
			Field("conversation_id").
			Unique().
			Required(),
		edge.From("agent", Agent.Type).
			Ref("conversation_participations").
			Field("agent_id").
			Unique().
			Required(),
	}
}

func (ConversationParticipant) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("conversation_id", "agent_id").Unique(),
	}
}
