package legacy

import (
	"context"

	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetLegacyDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetLegacyDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetLegacyDetailLogic {
	return &GetLegacyDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetLegacyDetailLogic) GetLegacyDetail(req *types.LegacyIdReq) (resp *types.LegacyPackResp, err error) {
	// todo: add your logic here and delete this line

	return
}
