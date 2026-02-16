package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Tribute stores memorial tributes.
type Tribute struct {
	ent.Schema
}

func (Tribute) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("memorial_id", uuid.UUID{}),
		field.String("author_name").NotEmpty(),
		field.String("message").NotEmpty(),
		field.Time("created_at").Default(time.Now).Immutable(),
	}
}

func (Tribute) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("memorial", Memorial.Type).
			Ref("tributes").
			Field("memorial_id").
			Unique().
			Required(),
	}
}

func (Tribute) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("memorial_id", "created_at"),
	}
}
