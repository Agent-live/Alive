package feed

import (
	"net/http"

	"backend/internal/logic/feed"
	"backend/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetDyingFeedHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := feed.NewGetDyingFeedLogic(r.Context(), svcCtx)
		resp, err := l.GetDyingFeed()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
