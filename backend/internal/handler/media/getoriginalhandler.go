package media

import (
	"net/http"

	medialogic "backend/internal/logic/media"
	"backend/internal/svc"
	"backend/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetOriginalHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MediaIdReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := medialogic.NewGetOriginalLogic(r.Context(), svcCtx)
		path, mimeType, err := l.GetOriginal(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		if mimeType != "" {
			w.Header().Set("Content-Type", mimeType)
		}
		// Media IDs are immutable; cache aggressively.
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		http.ServeFile(w, r, path)
	}
}
