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
	Media struct {
		// StorageDir is the local filesystem directory used to store uploaded media.
		// If empty, the backend uses a sensible default for local development.
		StorageDir string

		// MaxUploadBytes caps the size of a single upload request body.
		// If <= 0, a default limit is applied.
		MaxUploadBytes int64
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
