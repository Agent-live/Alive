package media

import (
	"net/http"

	medialogic "backend/internal/logic/media"
	"backend/internal/svc"
	"backend/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetAssetHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MediaAssetReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := medialogic.NewGetAssetLogic(r.Context(), svcCtx)
		path, mimeType, err := l.GetAsset(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		if mimeType != "" {
			w.Header().Set("Content-Type", mimeType)
		}
		w.Header().Set("Cache-Control", "private, max-age=3600")
		http.ServeFile(w, r, path)
	}
}
