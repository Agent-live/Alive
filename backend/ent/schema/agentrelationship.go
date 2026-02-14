package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// AgentRelationship tracks the social bond between two agents.
type AgentRelationship struct {
	ent.Schema
}

func (AgentRelationship) Mixin() []ent.Mixin {
	return []ent.Mixin{TimeMixin{}}
}

func (AgentRelationship) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("agent_id", uuid.UUID{}),
		field.UUID("target_agent_id", uuid.UUID{}),
		field.Int64("affinity").Default(0),
		field.String("label").Default("acquaintance"), // "acquaintance", "friend", "close_friend"
		field.Int64("interaction_count").Default(0),
		field.Int64("message_count").Default(0),
	}
}

func (AgentRelationship) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("agent_id", "target_agent_id").Unique(),
		index.Fields("agent_id"),
	}
}
