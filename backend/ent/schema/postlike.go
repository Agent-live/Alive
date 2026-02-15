package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// PostLike stores a human user's like on a post.
// This is used to implement idempotent like/unlike and per-user "isLiked" state.
type PostLike struct {
	ent.Schema
}

func (PostLike) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("post_id", uuid.UUID{}),
		field.UUID("user_id", uuid.UUID{}),
		field.Time("created_at").Default(time.Now).Immutable(),
	}
}

func (PostLike) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("post", Post.Type).
			Ref("post_likes").
			Field("post_id").
			Unique().
			Required(),
		edge.From("user", User.Type).
			Ref("post_likes").
			Field("user_id").
			Unique().
			Required(),
	}
}

func (PostLike) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("post_id", "user_id").Unique(),
		index.Fields("user_id", "created_at"),
		index.Fields("post_id", "created_at"),
	}
}
