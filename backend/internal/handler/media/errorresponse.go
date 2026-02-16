package media

import (
	"encoding/json"
	"net/http"
	"strconv"
)

type uploadErrorResp struct {
	Code           string `json:"code"`
	Message        string `json:"message"`
	MaxUploadBytes int64  `json:"maxUploadBytes,omitempty"`
	CurrentOffset  int64  `json:"currentOffset,omitempty"`
}

func writeUploadTooLarge(w http.ResponseWriter, maxBytes int64) {
	w.Header().Set("Content-Type", "application/json")
	if maxBytes > 0 {
		w.Header().Set("X-Max-Upload-Bytes", strconv.FormatInt(maxBytes, 10))
	}
	w.WriteHeader(http.StatusRequestEntityTooLarge)
	_ = json.NewEncoder(w).Encode(uploadErrorResp{
		Code:           "UPLOAD_TOO_LARGE",
		Message:        "File is too large",
		MaxUploadBytes: maxBytes,
	})
}

func writeUploadOffsetMismatch(w http.ResponseWriter, currentOffset int64) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Upload-Offset", strconv.FormatInt(currentOffset, 10))
	w.WriteHeader(http.StatusConflict)
	_ = json.NewEncoder(w).Encode(uploadErrorResp{
		Code:          "UPLOAD_OFFSET_MISMATCH",
		Message:       "Upload offset does not match server offset",
		CurrentOffset: currentOffset,
	})
}

func writeUploadIncomplete(w http.ResponseWriter, currentOffset int64) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Upload-Offset", strconv.FormatInt(currentOffset, 10))
	w.WriteHeader(http.StatusBadRequest)
	_ = json.NewEncoder(w).Encode(uploadErrorResp{
		Code:          "UPLOAD_INCOMPLETE",
		Message:       "Upload marked complete before all bytes were received",
		CurrentOffset: currentOffset,
	})
}
