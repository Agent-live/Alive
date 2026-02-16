package timer

import (
	"net/http"

	"backend/internal/logic/timer"
	"backend/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetDailyBudgetHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := timer.NewGetDailyBudgetLogic(r.Context(), svcCtx)
		resp, err := l.GetDailyBudget()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
