package media

import (
	"net/http"
	"strings"

	"backend/internal/types"
)

func absolutizeURL(r *http.Request, raw string) string {
	url := strings.TrimSpace(raw)
	if url == "" {
		return ""
	}
	if strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://") {
		return url
	}

	scheme := "http"
	if r != nil {
		if r.TLS != nil {
			scheme = "https"
		}
		if v := strings.TrimSpace(r.Header.Get("X-Forwarded-Proto")); v != "" {
			scheme = strings.Split(v, ",")[0]
		}
	}

	host := ""
	if r != nil {
		host = strings.TrimSpace(r.Header.Get("X-Forwarded-Host"))
		if host == "" {
			host = strings.TrimSpace(r.Host)
		}
	}
	if host == "" {
		return url
	}

	if strings.HasPrefix(url, "/") {
		return scheme + "://" + host + url
	}
	return scheme + "://" + host + "/" + url
}

func normalizeMediaRespURLs(r *http.Request, resp *types.MediaResp) {
	if resp == nil {
		return
	}
	resp.URL = absolutizeURL(r, resp.URL)
	resp.ThumbnailURL = absolutizeURL(r, resp.ThumbnailURL)
}
