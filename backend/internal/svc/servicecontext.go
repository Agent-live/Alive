package svc

import (
	"context"
	"fmt"
	"time"

	"backend/ent"
	"backend/internal/config"
	"backend/internal/openclaw"
	"backend/internal/service/timeengine"
	_ "github.com/lib/pq"
)

type ServiceContext struct {
	Config   config.Config
	DB       *ent.Client
	OpenClaw *openclaw.Client
	Time     *timeengine.Engine
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

	engine := timeengine.New(db, timeengine.Options{
		Enabled:  c.Timer.DecayEnabled,
		Interval: time.Duration(max64(c.Timer.TickIntervalSeconds, 60)) * time.Second,
	})
	engine.Start()

	return &ServiceContext{
		Config: c,
		DB:     db,
		OpenClaw: openclaw.NewClient(
			c.OpenClaw.Enabled,
			c.OpenClaw.BaseURL,
			c.OpenClaw.GatewayToken,
			c.OpenClaw.GreenMode,
			c.OpenClaw.SharedGateway,
			c.OpenClaw.WorkspaceRoot,
		),
		Time: engine,
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
