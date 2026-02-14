package memorial

import (
	"net/http"

	"backend/internal/logic/memorial"
	"backend/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetMemorialStatsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := memorial.NewGetMemorialStatsLogic(r.Context(), svcCtx)
		resp, err := l.GetMemorialStats()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
