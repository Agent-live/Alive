package legacy

import (
	"context"

	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListLegacyPacksLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListLegacyPacksLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListLegacyPacksLogic {
	return &ListLegacyPacksLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListLegacyPacksLogic) ListLegacyPacks() (resp *types.LegacyListResp, err error) {
	// todo: add your logic here and delete this line

	return
}
