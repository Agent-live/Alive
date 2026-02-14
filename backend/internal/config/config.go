package config

import "github.com/zeromicro/go-zero/rest"

type Config struct {
	rest.RestConf
	Auth struct {
		AccessSecret string
		AccessExpire int64
		Social       struct {
			AllowInsecureMock bool
			Google            struct {
				ClientIDs []string
			}
			Apple struct {
				ClientIDs []string
			}
		}
	}
	Timer struct {
		DecayEnabled        bool
		TickIntervalSeconds int64
	}
	Postgres struct {
		DSN string
	}
	OpenClaw struct {
		Enabled       bool
		BaseURL       string
		GatewayToken  string
		GreenMode     bool
		SharedGateway bool
		WorkspaceRoot string
	}
}
