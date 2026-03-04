package handler

import (
	"net/http"

	"backend/internal/handler/chat"
	"backend/internal/svc"

	"github.com/zeromicro/go-zero/rest"
)

// RegisterChatHandlers registers WebSocket chat route.
// REST routes (/send, /history) are now managed by goctl via alive.api.
func RegisterChatHandlers(server *rest.Server, svcCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/ws",
				Handler: chat.WebSocketHandler(svcCtx),
			},
		},
		rest.WithJwt(svcCtx.Config.Auth.AccessSecret),
		rest.WithPrefix("/api/v1/chat"),
	)
}
