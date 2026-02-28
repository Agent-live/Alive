package chat

import (
	"errors"
	"fmt"
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
	Content     string                  `json:"content,optional"`
	SessionID   string                  `json:"sessionId,optional"`
	Attachments []sendChatAttachmentReq `json:"attachments,optional"`
}

type sendChatAttachmentReq struct {
	MediaID string `json:"mediaId"`
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
		attachments, err := common.ResolveRichAttachments(r.Context(), svcCtx.DB, attachmentMediaIDs(req.Attachments))
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		userContent, _, err := common.EncodeRichMessage(userText, attachments)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, errors.New("content or attachments are required"))
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
			SetContent(userContent).
			SetCreatedAt(now).
			Save(r.Context())

		promptText := userText
		if len(attachments) > 0 {
			promptText = buildChatPrompt(userText, attachments)
		}

		aliveAgentRuntimeID := common.PtrString(ag.AliveAgentRuntimeID)
		assistantText, err := svcCtx.AliveAgent.ChatCompletion(
			r.Context(),
			aliveAgentRuntimeID,
			sessionID,
			u.ID.String(),
			promptText,
		)
		if err != nil {
			// Best-effort fallback: return a clear message and still persist it.
			assistantText = "AliveAgent is unavailable right now. Please try again later."
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

func attachmentMediaIDs(in []sendChatAttachmentReq) []string {
	if len(in) == 0 {
		return nil
	}
	out := make([]string, 0, len(in))
	seen := make(map[string]struct{}, len(in))
	for _, item := range in {
		id := strings.TrimSpace(item.MediaID)
		if id == "" {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out
}

func buildChatPrompt(text string, attachments []common.RichMessageAttachment) string {
	parts := make([]string, 0, len(attachments)+1)
	if strings.TrimSpace(text) != "" {
		parts = append(parts, strings.TrimSpace(text))
	}
	parts = append(parts, "User attached the following files:")
	for idx, item := range attachments {
		label := common.AttachmentMessageType(item.MimeType)
		parts = append(parts, fmt.Sprintf("%d. [%s] %s", idx+1, label, item.URL))
	}
	return strings.Join(parts, "\n")
}
