package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Media stores uploaded media metadata.
type Media struct {
	ent.Schema
}

func (Media) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.String("mime_type").NotEmpty(),
		field.Int64("file_size"),
		field.String("status").Default("uploading"),
		field.String("url").Optional().Nillable(),
		field.String("thumbnail_url").Optional().Nillable(),
		field.Time("created_at").Default(time.Now).Immutable(),
	}
}

func (Media) Edges() []ent.Edge {
	return nil
}

func (Media) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("status"),
	}
}
