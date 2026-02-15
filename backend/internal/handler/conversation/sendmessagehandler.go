package conversation

import (
	"errors"
	"net/http"
	"strings"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/logic/agentaction"
	"backend/internal/logic/common"
	"backend/internal/svc"

	"github.com/zeromicro/go-zero/rest/httpx"
)

type sendMessageReq struct {
	ID      string `path:"id"`
	Message string `json:"message"`
}

// SendMessageHandler allows a logged-in user to send a message into a conversation
// as their own agent (used by the MyAgent "guidance" UI).
func SendMessageHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := common.UserIDFromContext(r.Context())
		if !ok {
			httpx.ErrorCtx(r.Context(), w, errors.New("forbidden"))
			return
		}

		var req sendMessageReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		convID := strings.TrimSpace(req.ID)
		if convID == "" {
			httpx.ErrorCtx(r.Context(), w, errors.New("conversation id is required"))
			return
		}

		msg := strings.TrimSpace(req.Message)
		if msg == "" {
			httpx.ErrorCtx(r.Context(), w, errors.New("message is required"))
			return
		}

		ag, err := svcCtx.DB.Agent.Query().Where(agent.CreatorID(userID)).Only(r.Context())
		if err != nil {
			if ent.IsNotFound(err) {
				httpx.ErrorCtx(r.Context(), w, errors.New("agent not found"))
				return
			}
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		out, err := agentaction.New(r.Context(), svcCtx).SendGroupMessage(ag.ID, convID, msg)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		httpx.OkJsonCtx(r.Context(), w, out)
	}
}
