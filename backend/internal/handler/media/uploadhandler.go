package media

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	medialogic "backend/internal/logic/media"
	"backend/internal/svc"
	"backend/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func UploadHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MediaIdReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		limit := medialogic.MaxUploadBytes(svcCtx)
		r.Body = http.MaxBytesReader(w, r.Body, limit)

		l := medialogic.NewUploadLogic(r.Context(), svcCtx)
		offsetText := strings.TrimSpace(r.Header.Get("X-Upload-Offset"))
		if offsetText != "" {
			offset, parseErr := strconv.ParseInt(offsetText, 10, 64)
			if parseErr != nil || offset < 0 {
				httpx.ErrorCtx(r.Context(), w, errors.New("invalid X-Upload-Offset"))
				return
			}
			complete := parseTruthyHeader(r.Header.Get("X-Upload-Complete"))

			nextOffset, completed, err := l.UploadChunk(&req, r.Body, r.Header.Get("Content-Type"), offset, complete)
			if err != nil {
				var maxErr *http.MaxBytesError
				if errors.As(err, &maxErr) {
					writeUploadTooLarge(w, limit)
					return
				}
				var tooLarge *medialogic.FileTooLargeError
				if errors.As(err, &tooLarge) {
					writeUploadTooLarge(w, tooLarge.MaxBytes)
					return
				}
				var mismatch *medialogic.UploadOffsetMismatchError
				if errors.As(err, &mismatch) {
					writeUploadOffsetMismatch(w, mismatch.CurrentOffset)
					return
				}
				var incomplete *medialogic.UploadIncompleteError
				if errors.As(err, &incomplete) {
					writeUploadIncomplete(w, incomplete.Current)
					return
				}
				httpx.ErrorCtx(r.Context(), w, err)
				return
			}

			w.Header().Set("X-Upload-Offset", strconv.FormatInt(nextOffset, 10))
			if completed {
				w.Header().Set("X-Upload-Complete", "1")
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}

		if err := l.Upload(&req, r.Body, r.Header.Get("Content-Type")); err != nil {
			var maxErr *http.MaxBytesError
			if errors.As(err, &maxErr) {
				writeUploadTooLarge(w, limit)
				return
			}
			var tooLarge *medialogic.FileTooLargeError
			if errors.As(err, &tooLarge) {
				writeUploadTooLarge(w, tooLarge.MaxBytes)
				return
			}
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

func parseTruthyHeader(v string) bool {
	s := strings.TrimSpace(strings.ToLower(v))
	return s == "1" || s == "true" || s == "yes"
}
