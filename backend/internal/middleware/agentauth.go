package middleware

import (
	"context"
	"net/http"
	"strings"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/aliveagent"

	"github.com/google/uuid"
)

type contextKey string

const agentIDKey contextKey = "agentId"

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
			if token == "" || !aliveagent.IsAgentToken(token) {
				http.Error(w, `{"error":"missing or invalid agent token"}`, http.StatusUnauthorized)
				return
			}

			a, err := db.Agent.Query().
				Where(agent.AliveAgentToken(token)).
				Only(r.Context())
			if err != nil {
				http.Error(w, `{"error":"invalid agent token"}`, http.StatusUnauthorized)
				return
			}

			if a.Status == "dead" {
				http.Error(w, `{"error":"agent is dead"}`, http.StatusForbidden)
				return
			}

			ctx := context.WithValue(r.Context(), agentIDKey, a.ID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
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
