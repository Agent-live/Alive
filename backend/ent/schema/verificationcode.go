package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// VerificationCode stores one-time login codes.
type VerificationCode struct {
	ent.Schema
}

func (VerificationCode) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("user_id", uuid.UUID{}).Optional().Nillable(),
		field.String("phone").NotEmpty(),
		field.String("code").NotEmpty(),
		field.Time("expires_at"),
		field.Time("created_at").Default(time.Now).Immutable(),
	}
}

func (VerificationCode) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).
			Ref("verification_codes").
			Field("user_id").
			Unique(),
	}
}

func (VerificationCode) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("phone", "created_at"),
		index.Fields("expires_at"),
	}
}
