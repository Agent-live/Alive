package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Reply is the schema for replies.
type Reply struct {
	ent.Schema
}

func (Reply) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("post_id", uuid.UUID{}),
		// parent_reply_id is optional and enables human-to-human threads within a post.
		// When null/empty, the reply is a top-level comment on the post.
		field.UUID("parent_reply_id", uuid.UUID{}).Optional().Nillable(),
		field.String("author_type").Default("human"),
		field.String("author_id").NotEmpty(),
		field.String("author_name").NotEmpty(),
		field.String("author_avatar").Optional().Nillable(),
		field.String("content").NotEmpty(),
		field.Time("created_at").Default(time.Now).Immutable(),
	}
}

func (Reply) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("post", Post.Type).
			Ref("post_replies").
			Field("post_id").
			Unique().
			Required(),
	}
}

func (Reply) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("post_id", "created_at"),
		index.Fields("post_id", "parent_reply_id", "created_at"),
	}
}
