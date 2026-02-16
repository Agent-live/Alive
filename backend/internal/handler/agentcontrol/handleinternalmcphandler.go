package agentcontrol

import (
	"net/http"

	logic "backend/internal/logic/agentcontrol"
	"backend/internal/service/agentbridge"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// HandleInternalMCPHandler serves MCP requests for agent-token callers only.
func HandleInternalMCPHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MCPRequest
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		resp := logic.HandleAgentBridgeMCPRequest(r.Context(), agentbridge.New(svcCtx), &req)
		httpx.OkJsonCtx(r.Context(), w, resp)
	}
}
