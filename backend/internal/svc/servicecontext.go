package svc

import (
	"context"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/internal/aliveagent"
	"backend/internal/config"
	"backend/internal/service/timeengine"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

type ServiceContext struct {
	Config     config.Config
	DB         *ent.Client
	AliveAgent *aliveagent.Client
	Time       *timeengine.Engine
}

func NewServiceContext(c config.Config) *ServiceContext {
	db, err := ent.Open("postgres", c.Postgres.DSN)
	if err != nil {
		panic(fmt.Sprintf("failed opening postgres connection: %v", err))
	}
	if err := db.Schema.Create(context.Background()); err != nil {
		panic(fmt.Sprintf("failed creating schema resources: %v", err))
	}
	if err := bootstrapSeedData(context.Background(), db); err != nil {
		panic(fmt.Sprintf("failed seeding bootstrap data: %v", err))
	}

	aliveClient := aliveagent.NewClient(
		c.AliveAgent.Enabled,
		c.AliveAgent.BaseURL,
		c.AliveAgent.GatewayToken,
		c.AliveAgent.GreenMode,
		c.AliveAgent.SharedGateway,
		c.AliveAgent.WorkspaceRoot,
	)

	engine := timeengine.New(db, timeengine.Options{
		Enabled:   c.Timer.DecayEnabled,
		Interval:  time.Duration(max64(c.Timer.TickIntervalSeconds, 60)) * time.Second,
		EventHook: buildLifecycleEventHook(db, aliveClient),
	})
	engine.Start()

	return &ServiceContext{
		Config:     c,
		DB:         db,
		AliveAgent: aliveClient,
		Time:       engine,
	}
}

func (s *ServiceContext) Close() error {
	if s.Time != nil {
		s.Time.Stop()
	}
	if s.DB == nil {
		return nil
	}
	return s.DB.Close()
}

func max64(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}

func buildLifecycleEventHook(db *ent.Client, aliveClient *aliveagent.Client) timeengine.LifecycleEventHook {
	return func(ctx context.Context, event timeengine.LifecycleEvent) {
		if db == nil || aliveClient == nil {
			return
		}
		agentID := strings.TrimSpace(event.AgentID)
		eventType := strings.TrimSpace(event.Type)
		if agentID == "" || eventType == "" {
			return
		}
		id, err := uuid.Parse(agentID)
		if err != nil {
			return
		}
		ag, err := db.Agent.Get(ctx, id)
		if err != nil {
			return
		}
		runtimeAgentID := strings.TrimSpace(ptrString(ag.AliveAgentRuntimeID))
		if runtimeAgentID == "" {
			return
		}

		payload := map[string]any{
			"occurredAt": event.OccurredAt.UTC().Format(time.RFC3339),
		}
		for k, v := range event.Payload {
			payload[k] = v
		}

		_ = aliveClient.NotifyStructuredEvent(context.Background(), aliveagent.StructuredNotifyRequest{
			RuntimeAgentID: runtimeAgentID,
			AgentID:        ag.ID.String(),
			EventType:      eventType,
			Title:          "ALIVE Lifecycle Event",
			Message:        "ALIVE lifecycle event dispatched",
			DedupeKey:      strings.TrimSpace(event.DedupeKey),
			Payload:        payload,
			TimeoutSeconds: 120,
		})
	}
}

func ptrString(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}
