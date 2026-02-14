package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"net/http"
	"strings"

	"backend/ent"
	"backend/internal/config"
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
	conf.MustLoad(*configFile, &c)

	// Standardize API error responses for the frontend (code/message/details JSON).
	httpx.SetErrorHandlerCtx(func(_ctx context.Context, err error) (int, any) {
		if err == nil {
			return http.StatusOK, nil
		}
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
		msg := strings.TrimSpace(err.Error())
		if strings.Contains(strings.ToLower(msg), "forbidden") {
			return http.StatusForbidden, map[string]any{
				"code":    "FORBIDDEN",
				"message": msg,
			}
		}
		return http.StatusBadRequest, map[string]any{
			"code":    "BAD_REQUEST",
			"message": msg,
		}
	})

	server := rest.MustNewServer(c.RestConf)
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
	handler.RegisterConversationHandlers(server, ctx)

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
