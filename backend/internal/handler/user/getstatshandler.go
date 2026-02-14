package user

import (
	"net/http"

	"backend/internal/logic/user"
	"backend/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetStatsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := user.NewGetStatsLogic(r.Context(), svcCtx)
		resp, err := l.GetStats()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
