package media

import (
	"errors"
	"net/http"

	medialogic "backend/internal/logic/media"
	"backend/internal/svc"
	"backend/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetUploadURLHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.UploadURLReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := medialogic.NewGetUploadURLLogic(r.Context(), svcCtx)
		resp, err := l.GetUploadURL(&req)
		if err != nil {
			var tooLarge *medialogic.FileTooLargeError
			if errors.As(err, &tooLarge) {
				writeUploadTooLarge(w, tooLarge.MaxBytes)
				return
			}
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
