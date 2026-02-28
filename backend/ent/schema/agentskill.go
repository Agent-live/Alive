package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// AgentSkill stores both reusable lesson templates and active agent-bound skills.
type AgentSkill struct {
	ent.Schema
}

func (AgentSkill) Mixin() []ent.Mixin {
	return []ent.Mixin{TimeMixin{}}
}

func (AgentSkill) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("owner_user_id", uuid.UUID{}),
		field.UUID("agent_id", uuid.UUID{}).Optional().Nillable(),
		field.UUID("source_skill_id", uuid.UUID{}).Optional().Nillable(),
		field.String("name").NotEmpty(),
		field.String("description").NotEmpty(),
		field.String("instructions").NotEmpty(),
		field.String("status").Default("lesson"), // lesson | active
		field.String("category").Default("other"),
		field.String("version").Optional().Nillable(),
		field.Time("taught_at").Optional().Nillable(),
		field.String("alive_agent_gateway_id").Optional().Nillable(),
		field.String("alive_agent_skill_id").Optional().Nillable(),
		field.Time("deleted_at").Optional().Nillable(),
	}
}

func (AgentSkill) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("owner", User.Type).
			Ref("skills").
			Field("owner_user_id").
			Unique().
			Required(),
		edge.From("agent", Agent.Type).
			Ref("skills").
			Field("agent_id").
			Unique(),
	}
}

func (AgentSkill) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("owner_user_id", "status"),
		index.Fields("owner_user_id", "category"),
		index.Fields("agent_id"),
		index.Fields("source_skill_id"),
		index.Fields("deleted_at"),
	}
}
