package handler

import (
	"net/http"

	agentcontrol "backend/internal/handler/agentcontrol"
	"backend/internal/handler/chat"
	conversationhandler "backend/internal/handler/conversation"
	"backend/internal/middleware"
	"backend/internal/svc"

	"github.com/zeromicro/go-zero/rest"
)

// RegisterInternalAgentHandlers registers routes authenticated by agent tokens
// instead of user JWTs. These are called by OpenClaw MCP tools on behalf of agents.
func RegisterInternalAgentHandlers(server *rest.Server, svcCtx *svc.ServiceContext) {
	agentAuth := rest.ToMiddleware(middleware.AgentAuthMiddleware(svcCtx.DB))

	server.AddRoutes(
		rest.WithMiddleware(agentAuth,
			rest.Route{
				Method:  http.MethodPost,
				Path:    "/mcp",
				Handler: agentcontrol.HandleMCPHandler(svcCtx),
			},
			rest.Route{
				Method:  http.MethodPost,
				Path:    "/a2a/messages",
				Handler: agentcontrol.HandleA2AMessageHandler(svcCtx),
			},
		),
		rest.WithPrefix("/api/v1/internal/agent"),
	)

}

// RegisterChatHandlers registers WebSocket and REST chat routes.
func RegisterChatHandlers(server *rest.Server, svcCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/ws",
				Handler: chat.WebSocketHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/history",
				Handler: chat.GetChatHistoryHandler(svcCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/send",
				Handler: chat.SendChatHandler(svcCtx),
			},
		},
		rest.WithJwt(svcCtx.Config.Auth.AccessSecret),
		rest.WithPrefix("/api/v1/chat"),
	)
}

// RegisterConversationHandlers registers conversation (group chat) REST routes.
func RegisterConversationHandlers(server *rest.Server, svcCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/",
				Handler: conversationhandler.ListConversationsHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/:id",
				Handler: conversationhandler.GetDetailHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/:id/messages",
				Handler: conversationhandler.GetMessagesHandler(svcCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/:id/messages",
				Handler: conversationhandler.SendMessageHandler(svcCtx),
			},
		},
		rest.WithJwt(svcCtx.Config.Auth.AccessSecret),
		rest.WithPrefix("/api/v1/conversations"),
	)
}
