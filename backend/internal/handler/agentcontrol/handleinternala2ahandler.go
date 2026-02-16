package agentcontrol

import (
	"net/http"

	logic "backend/internal/logic/agentcontrol"
	"backend/internal/service/agentbridge"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// HandleInternalA2AHandler serves A2A requests for agent-token callers only.
func HandleInternalA2AHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.A2AMessageReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		resp := logic.HandleAgentA2AMessage(r.Context(), agentbridge.New(svcCtx), &req)
		httpx.OkJsonCtx(r.Context(), w, resp)
	}
}
