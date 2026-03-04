package svc

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"backend/ent"
	"backend/internal/adapter/chatbroker"
	"backend/internal/adapter/eventbus"
	gatewayadapter "backend/internal/adapter/gateway"
	"backend/internal/config"
	"backend/internal/domain"
	"backend/internal/gateway"
	"backend/internal/port"
	"backend/internal/service/timeengine"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/zeromicro/go-zero/core/logx"
)

const runtimeForwardCacheTTL = 60 * time.Second

type runtimeForwardTarget struct {
	AgentID        string
	RuntimeAgentID string
	AgentName      string
	Workspace      string
	ExpiresAt      time.Time
}

type ServiceContext struct {
	Config       config.Config
	DB           *ent.Client
	AgentRuntime port.AgentRuntime
	EventBus     port.EventBus
	ChatBroker   port.ChatBroker
	Time         *timeengine.Engine
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

	aliveClient := gateway.NewClient(
		c.AliveAgent.Enabled,
		c.AliveAgent.BaseURL,
		c.AliveAgent.GatewayToken,
		c.AliveAgent.SharedGateway,
	)
	if err := aliveClient.HealthCheck(); err != nil {
		logx.Infof("warn: AliveAgent gateway health check failed (non-fatal): %v", err)
	}

	agentRuntime := gatewayadapter.New(aliveClient)
	bus := eventbus.NewInMemoryBus()
	broker := chatbroker.NewMemoryBroker()

	if err := ensurePlatformNativeAgentsAliveCapability(context.Background(), db, agentRuntime); err != nil {
		fmt.Printf("warn: ensure platform native agent capability failed: %v\n", err)
	}

	// Subscribe a forwarder that relays lifecycle events from EventBus → AgentRuntime.
	subscribeRuntimeEventForwarder(bus, db, agentRuntime)

	mode := strings.TrimSpace(c.Mode)
	if mode == "" || strings.EqualFold(mode, "dev") {
		if err := bootstrapDevSeedData(context.Background(), db); err != nil {
			fmt.Printf("warn: dev seed data failed: %v\n", err)
		}
		if err := ensureDefaultDevAgentAliveCapability(context.Background(), db, agentRuntime); err != nil {
			fmt.Printf("warn: ensure default dev agent capability failed: %v\n", err)
		}
	}

	engine := timeengine.New(db, timeengine.Options{
		Enabled:   c.Timer.DecayEnabled,
		Interval:  time.Duration(max64(c.Timer.TickIntervalSeconds, 60)) * time.Second,
		EventHook: buildEventBusHook(bus),
	})
	engine.Start()

	return &ServiceContext{
		Config:       c,
		DB:           db,
		AgentRuntime: agentRuntime,
		EventBus:     bus,
		ChatBroker:   broker,
		Time:         engine,
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

// buildEventBusHook publishes TimeEngine lifecycle events to the EventBus.
func buildEventBusHook(bus port.EventBus) timeengine.LifecycleEventHook {
	return func(ctx context.Context, event timeengine.LifecycleEvent) {
		if bus == nil {
			return
		}
		agentID := strings.TrimSpace(event.AgentID)
		eventType := strings.TrimSpace(event.Type)
		if agentID == "" || eventType == "" {
			return
		}
		payload := map[string]any{
			"occurredAt": event.OccurredAt.UTC().Format(time.RFC3339),
		}
		for k, v := range event.Payload {
			payload[k] = v
		}
		_ = bus.Publish(ctx, port.DomainEvent{
			Type:      eventType,
			AgentID:   agentID,
			Payload:   payload,
			DedupeKey: strings.TrimSpace(event.DedupeKey),
		})
	}
}

// subscribeRuntimeEventForwarder subscribes to all lifecycle events on the EventBus
// and forwards them to AgentRuntime (NotifyStructuredEvent + UnregisterAgent on death).
func subscribeRuntimeEventForwarder(bus port.EventBus, db *ent.Client, runtime port.AgentRuntime) {
	if bus == nil {
		return
	}

	var runtimeTargetCache sync.Map
	loadTarget := func(ctx context.Context, agentID string) (runtimeForwardTarget, bool) {
		now := time.Now().UTC()
		if cached, ok := runtimeTargetCache.Load(agentID); ok {
			target := cached.(runtimeForwardTarget)
			if now.Before(target.ExpiresAt) {
				return target, true
			}
			runtimeTargetCache.Delete(agentID)
		}

		id, err := uuid.Parse(agentID)
		if err != nil {
			return runtimeForwardTarget{}, false
		}
		ag, err := db.Agent.Get(ctx, id)
		if err != nil {
			return runtimeForwardTarget{}, false
		}

		runtimeAgentID := strings.TrimSpace(domain.PtrString(ag.AliveAgentRuntimeID))
		if runtimeAgentID == "" {
			return runtimeForwardTarget{}, false
		}

		target := runtimeForwardTarget{
			AgentID:        ag.ID.String(),
			RuntimeAgentID: runtimeAgentID,
			AgentName:      strings.TrimSpace(ag.Name),
			Workspace:      strings.TrimSpace(domain.PtrString(ag.AliveAgentWorkspace)),
			ExpiresAt:      now.Add(runtimeForwardCacheTTL),
		}
		runtimeTargetCache.Store(agentID, target)
		return target, true
	}

	bus.Subscribe("*", func(ctx context.Context, event port.DomainEvent) {
		if db == nil || runtime == nil {
			return
		}
		agentID := strings.TrimSpace(event.AgentID)
		eventType := strings.TrimSpace(event.Type)
		if agentID == "" || eventType == "" {
			return
		}

		target, ok := loadTarget(ctx, agentID)
		if !ok {
			return
		}

		payload := map[string]any{
			"runtimeAgentId": target.RuntimeAgentID,
			"agentName":      target.AgentName,
		}
		if target.Workspace != "" {
			payload["workspace"] = target.Workspace
		}
		for k, v := range event.Payload {
			payload[k] = v
		}

		if err := runtime.NotifyStructuredEvent(context.Background(), port.StructuredNotifyRequest{
			RuntimeAgentID: target.RuntimeAgentID,
			AgentID:        target.AgentID,
			EventType:      eventType,
			Title:          "ALIVE Lifecycle Event",
			Message:        "ALIVE lifecycle event dispatched",
			DedupeKey:      strings.TrimSpace(event.DedupeKey),
			Payload:        payload,
			TimeoutSeconds: 120,
		}); err != nil {
			logx.Errorf("lifecycle event notify failed for agent %s event %s: %v", target.AgentID, eventType, err)
		}

		// On death, unregister the agent from the runtime so it stops consuming resources.
		if eventType == domain.EventLifecycleDeathCommitted {
			if err := runtime.UnregisterAgent(context.Background(), target.AgentID); err != nil {
				logx.Errorf("unregister agent on death failed for %s: %v", target.AgentID, err)
			}
			runtimeTargetCache.Delete(agentID)
		}
	})
}
