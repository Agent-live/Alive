package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// User is the schema for platform users.
type User struct {
	ent.Schema
}

func (User) Mixin() []ent.Mixin {
	return []ent.Mixin{TimeMixin{}}
}

func (User) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.String("phone").Optional().Nillable().Unique(),
		field.String("email").Optional().Nillable().Unique(),
		field.String("password_hash").Optional().Nillable(),
		field.String("nickname").NotEmpty(),
		field.String("avatar").Optional().Nillable(),
		field.String("bio").Optional().Nillable(),
		field.String("gender").Optional().Nillable(),
		field.String("birthdate").Optional().Nillable(),
		field.String("theme").Default("system"),
		field.String("language").Default("zh-CN"),
		field.Int("daily_login_streak").Default(0),
		field.Int64("total_timer_given").Default(0),
		field.Int64("total_timer_donated").Default(0),
		field.Int("agents_saved").Default(0),
		field.Int("agents_created").Default(0),
		field.Int("agents_lost").Default(0),
		field.Time("last_login_at").Optional().Nillable(),
	}
}

func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("agents", Agent.Type),
		edge.To("verification_codes", VerificationCode.Type),
		edge.To("skills", AgentSkill.Type),
		edge.To("experiences", AgentExperience.Type),
	}
}

func (User) Annotations() []schema.Annotation {
	return nil
}
