package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// ChannelConnection tracks external channel bindings.
type ChannelConnection struct {
	ent.Schema
}

func (ChannelConnection) Mixin() []ent.Mixin {
	return []ent.Mixin{TimeMixin{}}
}

func (ChannelConnection) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("agent_id", uuid.UUID{}),
		field.String("channel_type").NotEmpty(),
		field.String("status").Default("pending"),
		field.String("handle").Optional().Nillable(),
		field.String("deep_link").Optional().Nillable(),
		field.Time("connected_at").Optional().Nillable(),
	}
}

func (ChannelConnection) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("agent", Agent.Type).
			Ref("channel_connections").
			Field("agent_id").
			Unique().
			Required(),
	}
}

func (ChannelConnection) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("agent_id", "channel_type").Unique(),
	}
}
