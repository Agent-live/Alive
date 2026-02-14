package user

import (
	"net/http"

	"backend/internal/logic/user"
	"backend/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetSettingsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := user.NewGetSettingsLogic(r.Context(), svcCtx)
		resp, err := l.GetSettings()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
