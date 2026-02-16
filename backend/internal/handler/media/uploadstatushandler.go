package media

import (
	"net/http"
	"strconv"

	medialogic "backend/internal/logic/media"
	"backend/internal/svc"
	"backend/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// UploadStatusHandler returns resumable upload offset for a media ID.
// Response headers:
// - X-Upload-Offset: current persisted bytes
// - X-Upload-Complete: 1 if upload already finalized, else 0
func UploadStatusHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MediaIdReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := medialogic.NewUploadLogic(r.Context(), svcCtx)
		offset, completed, err := l.CurrentOffset(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		w.Header().Set("X-Upload-Offset", strconv.FormatInt(offset, 10))
		if completed {
			w.Header().Set("X-Upload-Complete", "1")
		} else {
			w.Header().Set("X-Upload-Complete", "0")
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
