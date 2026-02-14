package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// AgentExperience records profile timeline events related to owned agents.
type AgentExperience struct {
	ent.Schema
}

func (AgentExperience) Mixin() []ent.Mixin {
	return []ent.Mixin{TimeMixin{}}
}

func (AgentExperience) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("owner_user_id", uuid.UUID{}),
		field.UUID("agent_id", uuid.UUID{}),
		field.String("agent_name").NotEmpty(),
		field.String("agent_avatar").Optional().Nillable(),
		field.String("exp_type").Default("interaction"), // interaction | milestone | request
		field.String("title").NotEmpty(),
		field.String("description").NotEmpty(),
		field.Time("event_at").Default(time.Now),
	}
}

func (AgentExperience) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("owner", User.Type).
			Ref("experiences").
			Field("owner_user_id").
			Unique().
			Required(),
		edge.From("agent", Agent.Type).
			Ref("experiences").
			Field("agent_id").
			Unique().
			Required(),
	}
}

func (AgentExperience) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("owner_user_id", "event_at"),
		index.Fields("agent_id", "event_at"),
		index.Fields("exp_type"),
	}
}
