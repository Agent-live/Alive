package chat

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/logic/common"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/rest/httpx"
)

type sendChatReq struct {
	Content   string `json:"content"`
	SessionID string `json:"sessionId,optional"`
}

type sendChatResp struct {
	SessionID string `json:"sessionId"`
	Reply     string `json:"reply"`
	CreatedAt string `json:"createdAt"`
}

// SendChatHandler sends one user message to their agent and returns the agent reply.
// This is a REST fallback for clients that cannot attach Authorization headers to WebSocket upgrades.
func SendChatHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, err := common.CurrentUser(r.Context(), svcCtx.DB)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		var req sendChatReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		userText := strings.TrimSpace(req.Content)
		if userText == "" {
			httpx.ErrorCtx(r.Context(), w, errors.New("content is required"))
			return
		}

		ag, err := svcCtx.DB.Agent.Query().
			Where(agent.CreatorID(u.ID)).
			Only(r.Context())
		if err != nil {
			if ent.IsNotFound(err) {
				httpx.ErrorCtx(r.Context(), w, errors.New("agent not found"))
				return
			}
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}
		if ag.Status == "dead" {
			httpx.ErrorCtx(r.Context(), w, errors.New("agent is dead"))
			return
		}

		sessionID := strings.TrimSpace(req.SessionID)
		if sessionID == "" {
			sessionID = "main"
		}
		if len(sessionID) > 64 {
			// Keep it bounded for indexing and to avoid unbounded cardinality.
			sessionID = sessionID[:64]
		}

		now := time.Now().UTC()

		// Persist user message
		_, _ = svcCtx.DB.ChatMessage.Create().
			SetAgentID(ag.ID).
			SetUserID(u.ID).
			SetSessionID(sessionID).
			SetRole("user").
			SetContent(userText).
			SetCreatedAt(now).
			Save(r.Context())

		openclawAgentID := common.PtrString(ag.OpenclawAgentID)
		assistantText, err := svcCtx.OpenClaw.ChatCompletion(
			r.Context(),
			openclawAgentID,
			sessionID,
			u.ID.String(),
			userText,
		)
		if err != nil {
			// Best-effort fallback: return a clear message and still persist it.
			assistantText = "OpenClaw is unavailable right now. Please try again later."
		}

		assistantNow := time.Now().UTC()
		assistantID := uuid.New()
		_, _ = svcCtx.DB.ChatMessage.Create().
			SetID(assistantID).
			SetAgentID(ag.ID).
			SetUserID(u.ID).
			SetSessionID(sessionID).
			SetRole("assistant").
			SetContent(assistantText).
			SetCreatedAt(assistantNow).
			Save(r.Context())

		httpx.OkJsonCtx(r.Context(), w, sendChatResp{
			SessionID: sessionID,
			Reply:     assistantText,
			CreatedAt: common.TimeToISO(assistantNow),
		})
	}
}
