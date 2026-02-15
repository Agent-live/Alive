package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"strings"

	"backend/ent"
	"backend/internal/config"
	"backend/internal/svc"

	_ "github.com/lib/pq"
	"github.com/zeromicro/go-zero/core/conf"
)

var configFile = flag.String("f", "etc/alive-api.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c, conf.UseEnv())
	if v := strings.TrimSpace(os.Getenv("POSTGRES_DSN")); v != "" {
		c.Postgres.DSN = v
	}

	db, err := ent.Open("postgres", c.Postgres.DSN)
	if err != nil {
		panic(fmt.Sprintf("failed opening postgres connection: %v", err))
	}
	defer func() { _ = db.Close() }()

	if err := db.Schema.Create(context.Background()); err != nil {
		panic(fmt.Sprintf("failed creating schema resources: %v", err))
	}
	if err := svc.BootstrapSeedData(context.Background(), db); err != nil {
		panic(fmt.Sprintf("failed seeding bootstrap data: %v", err))
	}

	fmt.Println("seed: ok")
}
