package conversation

import (
	"errors"
	"net/http"

	"backend/ent/agent"
	"backend/internal/logic/common"
	conversationlogic "backend/internal/logic/conversation"
	"backend/internal/svc"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func ListConversationsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := common.UserIDFromContext(r.Context())
		if !ok {
			httpx.ErrorCtx(r.Context(), w, errors.New("forbidden"))
			return
		}

		ag, err := svcCtx.DB.Agent.Query().Where(agent.CreatorID(userID)).Only(r.Context())
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := conversationlogic.NewLogic(r.Context(), svcCtx)
		resp, err := l.ListConversations(ag.ID)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
