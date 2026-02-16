package chat

import (
	"net/http"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/chatmessage"
	"backend/internal/logic/common"
	"backend/internal/svc"

	"github.com/zeromicro/go-zero/rest/httpx"
)

type chatHistoryResp struct {
	Messages []chatHistoryItem `json:"messages"`
}

type chatHistoryItem struct {
	ID          string                  `json:"id"`
	Role        string                  `json:"role"`
	Content     string                  `json:"content"`
	Attachments []chatHistoryAttachment `json:"attachments,optional"`
	SessionID   string                  `json:"sessionId"`
	CreatedAt   string                  `json:"createdAt"`
}

type chatHistoryAttachment struct {
	MediaID      string `json:"mediaId"`
	MimeType     string `json:"mimeType"`
	URL          string `json:"url"`
	ThumbnailURL string `json:"thumbnailUrl,optional"`
	FileSize     int64  `json:"fileSize,optional"`
}

// GetChatHistoryHandler returns recent chat messages between the user and their agent.
func GetChatHistoryHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, err := common.CurrentUser(r.Context(), svcCtx.DB)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		ag, err := svcCtx.DB.Agent.Query().
			Where(agent.CreatorID(u.ID)).
			Only(r.Context())
		if err != nil {
			if ent.IsNotFound(err) {
				httpx.OkJsonCtx(r.Context(), w, chatHistoryResp{Messages: []chatHistoryItem{}})
			} else {
				httpx.ErrorCtx(r.Context(), w, err)
			}
			return
		}

		messages, err := svcCtx.DB.ChatMessage.Query().
			Where(
				chatmessage.AgentID(ag.ID),
				chatmessage.UserID(u.ID),
			).
			Order(ent.Desc(chatmessage.FieldCreatedAt)).
			Limit(50).
			All(r.Context())
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		items := make([]chatHistoryItem, 0, len(messages))
		// Reverse to chronological order
		for i := len(messages) - 1; i >= 0; i-- {
			m := messages[i]
			content := m.Content
			var attachments []chatHistoryAttachment
			if env, ok := common.DecodeRichMessage(m.Content); ok {
				content = env.Text
				if len(env.Attachments) > 0 {
					attachments = make([]chatHistoryAttachment, 0, len(env.Attachments))
					for _, item := range env.Attachments {
						attachments = append(attachments, chatHistoryAttachment{
							MediaID:      item.MediaID,
							MimeType:     item.MimeType,
							URL:          item.URL,
							ThumbnailURL: item.ThumbnailURL,
							FileSize:     item.FileSize,
						})
					}
				}
			}
			items = append(items, chatHistoryItem{
				ID:          m.ID.String(),
				Role:        m.Role,
				Content:     content,
				Attachments: attachments,
				SessionID:   m.SessionID,
				CreatedAt:   common.TimeToISO(m.CreatedAt),
			})
		}

		httpx.OkJsonCtx(r.Context(), w, chatHistoryResp{Messages: items})
	}
}
