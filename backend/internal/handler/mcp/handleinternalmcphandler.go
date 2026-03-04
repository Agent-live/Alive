package mcp

import (
	"net/http"

	mcplogic "backend/internal/logic/mcp"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// HandleInternalMCPHandler serves MCP requests for agent-token callers only.
// It delegates to the unified dispatcher, giving agents access to
// the full set of MCP tools (not just the 3-tool subset).
func HandleInternalMCPHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MCPRequest
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		resp := mcplogic.HandleAgentBridgeMCPRequest(r.Context(), svcCtx, &req)
		httpx.OkJsonCtx(r.Context(), w, resp)
	}
}
