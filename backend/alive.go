package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"backend/ent"
	"backend/internal/config"
	"backend/internal/domain"
	"backend/internal/handler"
	"backend/internal/service/timeengine"
	"backend/internal/svc"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/rest/httpx"
)

var configFile = flag.String("f", "etc/alive-api.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c, conf.UseEnv())
	// Keep file config as baseline; env is override layer for container/runtime deploys.
	applyEnvOverrides(&c)
	syncUploadBodyLimit(&c)

	// Standardize API error responses for the frontend (code/message/details JSON).
	httpx.SetErrorHandlerCtx(func(_ctx context.Context, err error) (int, any) {
		if err == nil {
			return http.StatusOK, nil
		}
		// Type-based error classification — checked first for precision.
		if ent.IsNotFound(err) {
			return http.StatusNotFound, map[string]any{
				"code":    "NOT_FOUND",
				"message": err.Error(),
			}
		}
		var be *timeengine.BusinessError
		if errors.As(err, &be) {
			return http.StatusBadRequest, map[string]any{
				"code":    "BUSINESS_RULE",
				"message": be.Error(),
			}
		}
		var ve *domain.ValidationError
		if errors.As(err, &ve) {
			return http.StatusBadRequest, map[string]any{
				"code":    "BAD_REQUEST",
				"message": ve.Error(),
			}
		}
		var fe *domain.ForbiddenError
		if errors.As(err, &fe) {
			return http.StatusForbidden, map[string]any{
				"code":    "FORBIDDEN",
				"message": "access denied",
			}
		}
		var ue *domain.UnauthorizedError
		if errors.As(err, &ue) {
			return http.StatusUnauthorized, map[string]any{
				"code":    "UNAUTHORIZED",
				"message": "authentication required",
			}
		}
		var ce *domain.ConflictError
		if errors.As(err, &ce) {
			return http.StatusConflict, map[string]any{
				"code":    "CONFLICT",
				"message": ce.Error(),
			}
		}
		// Legacy string-based fallback for un-migrated callers.
		msg := strings.TrimSpace(err.Error())
		lower := strings.ToLower(msg)
		if strings.Contains(lower, "forbidden") {
			return http.StatusForbidden, map[string]any{
				"code":    "FORBIDDEN",
				"message": "access denied",
			}
		}
		if strings.Contains(lower, "unauthorized") ||
			strings.Contains(lower, "invalid token") {
			return http.StatusUnauthorized, map[string]any{
				"code":    "UNAUTHORIZED",
				"message": "authentication required",
			}
		}
		if strings.Contains(lower, "invalid") ||
			strings.Contains(lower, "required") ||
			strings.Contains(lower, "missing") {
			return http.StatusBadRequest, map[string]any{
				"code":    "BAD_REQUEST",
				"message": msg,
			}
		}
		// Default: internal server error — hide details from client.
		return http.StatusInternalServerError, map[string]any{
			"code":    "INTERNAL_ERROR",
			"message": "an unexpected error occurred",
		}
	})

	server := rest.MustNewServer(
		c.RestConf,
		rest.WithCors(),
		rest.WithCorsHeaders(
			"Authorization",
			"Content-Type",
			"Accept",
			"Origin",
			"X-Requested-With",
		),
	)
	defer server.Stop()

	ctx := svc.NewServiceContext(c)
	defer func() {
		if err := ctx.Close(); err != nil {
			fmt.Printf("failed closing resources: %v\n", err)
		}
	}()
	handler.RegisterHandlers(server, ctx)
	handler.RegisterInternalAgentHandlers(server, ctx)
	handler.RegisterChatHandlers(server, ctx)

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}

func applyEnvOverrides(c *config.Config) {
	// File-based config remains source-of-truth in repo; deployment env can override
	// critical runtime knobs without patching tracked config files.
	if c == nil {
		return
	}

	if v := strings.TrimSpace(os.Getenv("ALIVE_API_HOST")); v != "" {
		c.Host = v
	}
	if v := strings.TrimSpace(os.Getenv("ALIVE_API_PORT")); v != "" {
		if p, err := strconv.Atoi(v); err == nil && p > 0 {
			c.Port = p
		}
	}

	if v := strings.TrimSpace(os.Getenv("POSTGRES_DSN")); v != "" {
		c.Postgres.DSN = v
	}

	if v := strings.TrimSpace(os.Getenv("ALIVE_AGENT_BASE_URL")); v != "" {
		c.AliveAgent.BaseURL = v
	}
	if v := strings.TrimSpace(os.Getenv("ALIVE_AGENT_GATEWAY_TOKEN")); v != "" {
		c.AliveAgent.GatewayToken = v
	}
	if v := strings.TrimSpace(os.Getenv("ALIVE_AGENT_ENABLED")); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			c.AliveAgent.Enabled = b
		}
	}
	if v := strings.TrimSpace(os.Getenv("ALIVE_AGENT_SHARED_GATEWAY")); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			c.AliveAgent.SharedGateway = b
		}
	}
}

func syncUploadBodyLimit(c *config.Config) {
	if c == nil {
		return
	}
	// Align rest framework request cap with media upload cap to avoid split limits.
	if c.Media.MaxUploadBytes <= 0 {
		return
	}
	if c.MaxBytes <= 0 || c.MaxBytes < c.Media.MaxUploadBytes {
		c.MaxBytes = c.Media.MaxUploadBytes
	}
}
