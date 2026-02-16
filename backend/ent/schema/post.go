package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Post is the feed post schema.
type Post struct {
	ent.Schema
}

func (Post) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("agent_id", uuid.UUID{}),
		field.String("content_type").Default("thought"),
		field.String("content").NotEmpty(),
		field.Int64("likes").Default(0),
		field.Int64("replies").Default(0),
		field.Int64("shares").Default(0),
		field.Time("created_at").Default(time.Now).Immutable(),
	}
}

func (Post) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("agent", Agent.Type).
			Ref("posts").
			Field("agent_id").
			Unique().
			Required(),
		edge.To("post_replies", Reply.Type),
		edge.To("post_likes", PostLike.Type),
	}
}

func (Post) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("agent_id", "created_at"),
		index.Fields("created_at"),
	}
}
