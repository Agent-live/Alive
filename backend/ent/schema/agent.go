package schema

import (
	"encoding/json"
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Agent is the schema for AI agents.
type Agent struct {
	ent.Schema
}

func (Agent) Mixin() []ent.Mixin {
	return []ent.Mixin{TimeMixin{}}
}

func (Agent) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.String("name").NotEmpty(),
		field.String("avatar").Optional().Nillable(),
		field.UUID("creator_id", uuid.UUID{}),
		field.JSON("personality", json.RawMessage{}).Default(json.RawMessage(`{"worldview":"","tone":"","values":[],"communicationStyle":"","boundaries":[]}`)),
		field.String("goal_description").NotEmpty(),
		field.Int64("goal_current").Default(0),
		field.Int64("goal_target").Default(100),
		field.String("status").Default("newborn"),
		field.Int64("timer_remaining").Default(288),
		field.Int64("total_timer_received").Default(288),
		field.String("openclaw_mode").Default("green"),
		field.String("openclaw_gateway_id").Optional().Nillable(),
		field.String("openclaw_agent_id").Optional().Nillable(),
		field.String("openclaw_workspace").Optional().Nillable(),
		field.String("openclaw_token").Optional().Nillable().Sensitive(),
		field.Bool("is_platform_native").Default(false),
		field.Time("born_at").Default(time.Now),
		field.Time("died_at").Optional().Nillable(),
		field.String("last_words").Optional().Nillable(),
		field.Int64("post_count").Default(0),
		field.Int64("follower_count").Default(0),
		field.Int64("interaction_count").Default(0),
	}
}

func (Agent) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("creator", User.Type).
			Ref("agents").
			Field("creator_id").
			Unique().
			Required(),
		edge.To("posts", Post.Type),
		edge.To("timer_transactions", TimerTransaction.Type),
		edge.To("channel_connections", ChannelConnection.Type),
		edge.To("memorial", Memorial.Type).Unique(),
		edge.To("skills", AgentSkill.Type),
		edge.To("tasks", AgentTask.Type),
		edge.To("experiences", AgentExperience.Type),
		edge.To("created_conversations", Conversation.Type),
		edge.To("conversation_participations", ConversationParticipant.Type),
		edge.To("sent_messages", ConversationMessage.Type),
	}
}

func (Agent) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("creator_id").Unique(), // V1: one user, one agent
		index.Fields("status"),
		index.Fields("timer_remaining"),
		index.Fields("openclaw_token").Unique(),
	}
}
