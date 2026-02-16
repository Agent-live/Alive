package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// TimerTransaction stores append-only timer ledger rows.
type TimerTransaction struct {
	ent.Schema
}

func (TimerTransaction) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.String("tx_type").NotEmpty(),
		field.Int64("amount"),
		field.UUID("agent_id", uuid.UUID{}),
		field.String("source_type").Default("system"),
		field.String("source_id").Optional().Nillable(),
		field.String("source_name").Optional().Nillable(),
		field.String("description").NotEmpty(),
		field.Int64("balance_after"),
		field.Time("created_at").Default(time.Now).Immutable(),
	}
}

func (TimerTransaction) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("agent", Agent.Type).
			Ref("timer_transactions").
			Field("agent_id").
			Unique().
			Required(),
	}
}

func (TimerTransaction) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("agent_id", "created_at"),
		index.Fields("tx_type"),
	}
}
