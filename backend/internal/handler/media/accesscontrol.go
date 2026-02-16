package media

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/internal/auth"
	"backend/internal/svc"
)

func ensureMediaAuthorized(w http.ResponseWriter, r *http.Request, svcCtx *svc.ServiceContext) bool {
	token := extractBearerToken(strings.TrimSpace(r.Header.Get("Authorization")))
	if token == "" {
		token = strings.TrimSpace(r.URL.Query().Get("token"))
	}
	if token == "" {
		writeUnauthorized(w)
		return false
	}
	if _, err := auth.ParseToken(svcCtx.Config.Auth.AccessSecret, token); err != nil {
		writeUnauthorized(w)
		return false
	}
	return true
}

func extractBearerToken(authHeader string) string {
	if authHeader == "" {
		return ""
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(authHeader, prefix) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(authHeader, prefix))
}

func writeUnauthorized(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"code":    "UNAUTHORIZED",
		"message": "Please log in first",
	})
}
