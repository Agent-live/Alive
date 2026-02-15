package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// AgentTask stores tasks created and managed by agents via MCP.
type AgentTask struct {
	ent.Schema
}

func (AgentTask) Mixin() []ent.Mixin {
	return []ent.Mixin{TimeMixin{}}
}

func (AgentTask) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("agent_id", uuid.UUID{}),
		field.String("title").NotEmpty().MaxLen(200),
		field.String("description").Optional().Nillable().MaxLen(2000),
		field.String("status").Default("pending"),             // pending | in_progress | done | failed
		field.String("priority").Default("medium").Optional(), // low | medium | high
		field.Int("progress").Default(0).Min(0).Max(100),
		field.Time("deleted_at").Optional().Nillable(),
	}
}

func (AgentTask) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("agent", Agent.Type).
			Ref("tasks").
			Field("agent_id").
			Unique().
			Required(),
	}
}

func (AgentTask) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("agent_id", "status"),
		index.Fields("agent_id", "created_at"),
		index.Fields("deleted_at"),
	}
}
