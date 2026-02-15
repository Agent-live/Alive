package chat

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/logic/common"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/zeromicro/go-zero/core/logx"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // TODO: restrict in production
	},
}

type chatMessage struct {
	Type      string `json:"type"` // "message", "typing", "error"
	Content   string `json:"content"`
	Role      string `json:"role"` // "user" or "assistant"
	SessionID string `json:"sessionId"`
	Timestamp string `json:"timestamp"`
}

// WebSocketHandler upgrades HTTP to WebSocket for user-agent chat.
// The user must be JWT-authenticated and can only chat with their own agent.
func WebSocketHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, err := common.CurrentUser(r.Context(), svcCtx.DB)
		if err != nil {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		// Find user's agent
		ag, err := svcCtx.DB.Agent.Query().
			Where(agent.CreatorID(u.ID)).
			Only(r.Context())
		if err != nil {
			if ent.IsNotFound(err) {
				http.Error(w, `{"error":"no agent found"}`, http.StatusNotFound)
			} else {
				http.Error(w, `{"error":"internal error"}`, http.StatusInternalServerError)
			}
			return
		}
		if ag.Status == "dead" {
			http.Error(w, `{"error":"agent is dead"}`, http.StatusForbidden)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			logx.Errorf("websocket upgrade failed: %v", err)
			return
		}
		defer conn.Close()

		sessionID := uuid.NewString()[:8]
		openclawAgentID := common.PtrString(ag.OpenclawAgentID)

		// Send connection established message
		_ = conn.WriteJSON(chatMessage{
			Type:      "connected",
			SessionID: sessionID,
			Content:   ag.Name + " is ready to chat",
			Role:      "system",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})

		for {
			_, raw, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
					logx.Errorf("ws read error: %v", err)
				}
				break
			}

			var incoming chatMessage
			if err := json.Unmarshal(raw, &incoming); err != nil {
				_ = conn.WriteJSON(chatMessage{
					Type:      "error",
					Content:   "invalid message format",
					Timestamp: time.Now().UTC().Format(time.RFC3339),
				})
				continue
			}

			userText := strings.TrimSpace(incoming.Content)
			if userText == "" {
				continue
			}

			// Save user message
			_, _ = svcCtx.DB.ChatMessage.Create().
				SetAgentID(ag.ID).
				SetUserID(u.ID).
				SetSessionID(sessionID).
				SetRole("user").
				SetContent(userText).
				SetCreatedAt(time.Now().UTC()).
				Save(r.Context())

			// Send typing indicator
			_ = conn.WriteJSON(chatMessage{
				Type:      "typing",
				Role:      "assistant",
				Timestamp: time.Now().UTC().Format(time.RFC3339),
			})

			// Call OpenClaw for agent response
			response, err := svcCtx.OpenClaw.ChatCompletion(
				r.Context(),
				openclawAgentID,
				sessionID,
				u.ID.String(),
				userText,
			)
			if err != nil {
				logx.Errorf("openclaw chat error: %v", err)
				_ = conn.WriteJSON(chatMessage{
					Type:      "error",
					Content:   "Agent is unable to respond right now",
					Timestamp: time.Now().UTC().Format(time.RFC3339),
				})
				continue
			}

			// Save assistant message
			_, _ = svcCtx.DB.ChatMessage.Create().
				SetAgentID(ag.ID).
				SetUserID(u.ID).
				SetSessionID(sessionID).
				SetRole("assistant").
				SetContent(response).
				SetCreatedAt(time.Now().UTC()).
				Save(r.Context())

			// Send agent response
			_ = conn.WriteJSON(chatMessage{
				Type:      "message",
				Content:   response,
				Role:      "assistant",
				SessionID: sessionID,
				Timestamp: time.Now().UTC().Format(time.RFC3339),
			})
		}
	}
}
