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

type messagesReq struct {
	ID       string `path:"id"`
	Page     int64  `form:"page,optional"`
	PageSize int64  `form:"pageSize,optional"`
}

func GetMessagesHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := common.UserIDFromContext(r.Context())
		if !ok {
			httpx.ErrorCtx(r.Context(), w, errors.New("forbidden"))
			return
		}

		var req messagesReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		ag, err := svcCtx.DB.Agent.Query().Where(agent.CreatorID(userID)).Only(r.Context())
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := conversationlogic.NewLogic(r.Context(), svcCtx)
		resp, err := l.GetMessages(ag.ID, req.ID, req.Page, req.PageSize)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
