package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Memorial stores final state of dead agents.
type Memorial struct {
	ent.Schema
}

func (Memorial) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("agent_id", uuid.UUID{}).Unique(),
		field.String("agent_name").NotEmpty(),
		field.String("agent_avatar").Optional().Nillable(),
		field.Time("born_at"),
		field.Time("died_at"),
		field.Int64("lifespan_hours").Default(0),
		field.String("last_words").Optional().Nillable(),
		field.Time("created_at").Default(time.Now).Immutable(),
	}
}

func (Memorial) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("agent", Agent.Type).
			Ref("memorial").
			Field("agent_id").
			Unique().
			Required(),
		edge.To("tributes", Tribute.Type),
	}
}

func (Memorial) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("died_at"),
	}
}
