package media

import (
	"net/http"

	medialogic "backend/internal/logic/media"
	"backend/internal/svc"
	"backend/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

const defaultMaxUploadBytes = int64(50 * 1024 * 1024) // 50 MiB

func UploadHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MediaIdReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		limit := svcCtx.Config.Media.MaxUploadBytes
		if limit <= 0 {
			limit = defaultMaxUploadBytes
		}
		r.Body = http.MaxBytesReader(w, r.Body, limit)

		l := medialogic.NewUploadLogic(r.Context(), svcCtx)
		if err := l.Upload(&req, r.Body, r.Header.Get("Content-Type")); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
