package handler

import (
	"net/http"

	"backend/internal/handler/mcp"
	"backend/internal/middleware"
	"backend/internal/svc"

	"github.com/zeromicro/go-zero/rest"
)

// RegisterInternalAgentHandlers registers routes authenticated by agent tokens
// instead of user JWTs. These are called by AliveAgent MCP tools on behalf of agents.
func RegisterInternalAgentHandlers(server *rest.Server, svcCtx *svc.ServiceContext) {
	agentAuth := rest.ToMiddleware(middleware.AgentAuthMiddleware(svcCtx.DB))

	server.AddRoutes(
		rest.WithMiddleware(agentAuth,
			rest.Route{
				Method:  http.MethodPost,
				Path:    "/mcp",
				Handler: mcp.HandleInternalMCPHandler(svcCtx),
			},
		),
		rest.WithPrefix("/api/v1/internal/agent"),
	)
}
