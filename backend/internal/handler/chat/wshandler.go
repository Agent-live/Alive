package chat

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	"backend/internal/domain"
	chatlogic "backend/internal/logic/chat"
	"backend/internal/logic/common"
	"backend/internal/mapper"
	"backend/internal/selector"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/zeromicro/go-zero/core/logx"
)

// newUpgrader creates a WebSocket upgrader with origin checking based on config.
func newUpgrader(allowedOrigins []string) websocket.Upgrader {
	return websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			if origin == "" {
				return true // non-browser clients (CLI, agents)
			}
			parsed, err := url.Parse(origin)
			if err != nil {
				return false
			}
			host := parsed.Hostname()
			for _, allowed := range allowedOrigins {
				if host == allowed || strings.HasSuffix(host, "."+allowed) {
					return true
				}
			}
			return false
		},
	}
}

type chatAttachmentReq struct {
	MediaId string `json:"mediaId"`
}

type chatMessage struct {
	Type           string              `json:"type"` // "message", "stream", "typing", "error"
	Content        string              `json:"content"`
	Attachments    []chatAttachmentReq `json:"attachments,omitempty"`
	Role           string              `json:"role"` // "user" or "assistant"
	ConversationID string              `json:"conversationId,omitempty"`
	MessageID      string              `json:"messageId,omitempty"`
	Timestamp      string              `json:"timestamp"`
}

// WebSocketHandler upgrades HTTP to WebSocket for user-agent chat.
// The user must be JWT-authenticated and can only chat with their own agent.
func WebSocketHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	upgrader := newUpgrader(svcCtx.Config.WebSocket.AllowedOrigins)
	return func(w http.ResponseWriter, r *http.Request) {
		u, err := common.CurrentUser(r.Context(), svcCtx.DB)
		if err != nil {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}

		// Resolve the acting agent (supports explicit agentId selection).
		ag, err := selector.ResolveOwnedAgentForUser(
			r.Context(),
			svcCtx.DB,
			u.ID,
			r.URL.Query().Get("agentId"),
		)
		if err != nil {
			if strings.EqualFold(err.Error(), "agent not found") {
				http.Error(w, `{"error":"no agent found"}`, http.StatusNotFound)
			} else {
				http.Error(w, `{"error":"internal error"}`, http.StatusInternalServerError)
			}
			return
		}
		if ag.Status == domain.StatusDead {
			http.Error(w, `{"error":"agent is dead"}`, http.StatusForbidden)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			logx.Errorf("websocket upgrade failed: %v", err)
			return
		}
		defer conn.Close()

		connID := uuid.NewString()

		// Send connection established message
		if err := conn.WriteJSON(chatMessage{
			Type:           "connected",
			ConversationID: connID,
			Content:        ag.Name + " is ready to chat",
			Role:           domain.ChatRoleSystem,
			Timestamp:      time.Now().UTC().Format(time.RFC3339),
		}); err != nil {
			logx.Errorf("ws write connected message failed: %v", err)
		}

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
				if wErr := conn.WriteJSON(chatMessage{
					Type:      "error",
					Content:   "invalid message format",
					Timestamp: time.Now().UTC().Format(time.RFC3339),
				}); wErr != nil {
					logx.Errorf("ws write error message failed: %v", wErr)
				}
				continue
			}

			userText := strings.TrimSpace(incoming.Content)
			mediaEntries, err := mapper.LoadReadyMedia(r.Context(), svcCtx.DB, extractAttachmentMediaIDs(incoming.Attachments))
			if err != nil {
				if wErr := conn.WriteJSON(chatMessage{
					Type:      "error",
					Content:   "invalid attachments",
					Timestamp: time.Now().UTC().Format(time.RFC3339),
				}); wErr != nil {
					logx.Errorf("ws write error message failed: %v", wErr)
				}
				continue
			}
			attachments := mapper.ResolveRichAttachments(mediaEntries)

			// Send typing indicator
			if wErr := conn.WriteJSON(chatMessage{
				Type:      "typing",
				Role:      domain.ChatRoleAssistant,
				Timestamp: time.Now().UTC().Format(time.RFC3339),
			}); wErr != nil {
				logx.Errorf("ws write typing indicator failed: %v", wErr)
			}

			// Delegate to business logic with streaming callback.
			streamCB := func(token string, done bool) {
				if done {
					return // final message sent below with full result
				}
				if wErr := conn.WriteJSON(chatMessage{
					Type:      "stream",
					Content:   token,
					Role:      domain.ChatRoleAssistant,
					Timestamp: time.Now().UTC().Format(time.RFC3339),
				}); wErr != nil {
					logx.Errorf("ws write stream chunk failed: %v", wErr)
				}
			}

			result, err := chatlogic.SendMessageStreaming(r.Context(), svcCtx, chatlogic.SendMessageInput{
				UserID:      u.ID,
				Agent:       ag,
				UserText:    userText,
				Attachments: attachments,
			}, streamCB)
			if err != nil {
				if wErr := conn.WriteJSON(chatMessage{
					Type:      "error",
					Content:   err.Error(),
					Timestamp: time.Now().UTC().Format(time.RFC3339),
				}); wErr != nil {
					logx.Errorf("ws write error message failed: %v", wErr)
				}
				continue
			}

			// Send final complete message (client uses this to finalize the streamed content).
			if wErr := conn.WriteJSON(chatMessage{
				Type:           "message",
				Content:        result.Reply,
				Role:           domain.ChatRoleAssistant,
				ConversationID: result.ConversationID,
				MessageID:      result.MessageID,
				Timestamp:      result.CreatedAt.Format(time.RFC3339),
			}); wErr != nil {
				logx.Errorf("ws write assistant message failed: %v", wErr)
			}
		}
	}
}

func extractAttachmentMediaIDs(in []chatAttachmentReq) []string {
	if len(in) == 0 {
		return nil
	}
	ids := make([]string, 0, len(in))
	for _, item := range in {
		id := strings.TrimSpace(item.MediaId)
		if id == "" {
			continue
		}
		ids = append(ids, id)
	}
	return mapper.DedupeMediaIDs(ids)
}
