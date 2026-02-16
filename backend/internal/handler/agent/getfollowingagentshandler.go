package agent

import (
	"net/http"

	"backend/internal/logic/agent"
	"backend/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetFollowingAgentsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := agent.NewGetFollowingAgentsLogic(r.Context(), svcCtx)
		resp, err := l.GetFollowingAgents()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
