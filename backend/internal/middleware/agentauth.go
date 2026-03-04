package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/domain"
	"backend/internal/gateway"

	"github.com/google/uuid"
)

type contextKey string

const agentIDKey contextKey = "agentId"

var (
	localBypassOnce sync.Once
	localBypassMode bool
)

// AgentFromCtx extracts the authenticated agent ID from the request context.
func AgentFromCtx(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(agentIDKey).(uuid.UUID)
	return id, ok
}

// WithAgentCtx injects an authenticated agent ID into context.
// This is primarily used by internal call chains and tests.
func WithAgentCtx(ctx context.Context, id uuid.UUID) context.Context {
	if ctx == nil {
		ctx = context.Background()
	}
	return context.WithValue(ctx, agentIDKey, id)
}

// AgentAuthMiddleware authenticates requests using agent tokens (alive_agent_*).
// It looks up the agent by its alive_agent_token and injects the agent ID into context.
func AgentAuthMiddleware(db *ent.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractBearerToken(r)
			if token != "" && gateway.IsAgentToken(token) {
				a, err := db.Agent.Query().
					Where(agent.AliveAgentToken(token)).
					Only(r.Context())
				if err != nil {
					http.Error(w, `{"error":"invalid agent token"}`, http.StatusUnauthorized)
					return
				}

				if a.Status == domain.StatusDead {
					http.Error(w, `{"error":"agent is dead"}`, http.StatusForbidden)
					return
				}

				ctx := context.WithValue(r.Context(), agentIDKey, a.ID)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			// Explicit local bypass for development only.
			// Disabled by default; opt-in via ALIVE_AGENT_LOCAL_BYPASS=true.
			if localBypassEnabled() && isLocalRequest(r) {
				agentID, ok := extractLocalAgentID(r)
				if !ok {
					http.Error(
						w,
						`{"error":"localhost request requires x-alive-agent-id header or agentId in JSON body"}`,
						http.StatusUnauthorized,
					)
					return
				}

				a, err := db.Agent.Get(r.Context(), agentID)
				if err != nil {
					http.Error(w, `{"error":"invalid local agent id"}`, http.StatusUnauthorized)
					return
				}
				if a.Status == domain.StatusDead {
					http.Error(w, `{"error":"agent is dead"}`, http.StatusForbidden)
					return
				}

				ctx := context.WithValue(r.Context(), agentIDKey, a.ID)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			http.Error(w, `{"error":"missing or invalid agent token"}`, http.StatusUnauthorized)
		})
	}
}

func localBypassEnabled() bool {
	localBypassOnce.Do(func() {
		raw := strings.TrimSpace(os.Getenv("ALIVE_AGENT_LOCAL_BYPASS"))
		if raw == "" {
			localBypassMode = false
			return
		}
		enabled, err := strconv.ParseBool(raw)
		if err != nil {
			localBypassMode = false
			return
		}
		localBypassMode = enabled
	})
	return localBypassMode
}

func extractBearerToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if auth == "" {
		return ""
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

func isLocalRequest(r *http.Request) bool {
	remote := strings.TrimSpace(r.RemoteAddr)
	if remote == "" {
		return false
	}

	host, _, err := net.SplitHostPort(remote)
	if err != nil {
		host = remote
	}
	host = strings.TrimSpace(strings.Trim(host, "[]"))
	switch strings.ToLower(host) {
	case "127.0.0.1", "::1", "localhost":
		return true
	default:
		return false
	}
}

func extractLocalAgentID(r *http.Request) (uuid.UUID, bool) {
	for _, key := range []string{"X-Alive-Agent-Id", "X-Agent-Id"} {
		value := strings.TrimSpace(r.Header.Get(key))
		if value == "" {
			continue
		}
		if id, err := uuid.Parse(value); err == nil {
			return id, true
		}
	}

	if r.Body == nil {
		return uuid.Nil, false
	}
	raw, err := io.ReadAll(r.Body)
	if err != nil {
		return uuid.Nil, false
	}
	r.Body = io.NopCloser(bytes.NewReader(raw))
	if len(bytes.TrimSpace(raw)) == 0 {
		return uuid.Nil, false
	}

	var payload map[string]any
	if err := json.Unmarshal(raw, &payload); err != nil {
		return uuid.Nil, false
	}

	candidates := []any{
		payload["agentId"],
		nestedValue(payload, "payload", "agentId"),
		nestedValue(payload, "params", "agentId"),
		nestedValue(payload, "params", "arguments", "agentId"),
	}
	for _, item := range candidates {
		text, ok := item.(string)
		if !ok {
			continue
		}
		text = strings.TrimSpace(text)
		if text == "" {
			continue
		}
		if id, err := uuid.Parse(text); err == nil {
			return id, true
		}
	}
	return uuid.Nil, false
}

func nestedValue(root map[string]any, keys ...string) any {
	var current any = root
	for _, key := range keys {
		obj, ok := current.(map[string]any)
		if !ok {
			return nil
		}
		current = obj[key]
	}
	return current
}
