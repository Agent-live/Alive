package legacy

import (
	"context"

	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type InheritLegacyLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewInheritLegacyLogic(ctx context.Context, svcCtx *svc.ServiceContext) *InheritLegacyLogic {
	return &InheritLegacyLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *InheritLegacyLogic) InheritLegacy(req *types.LegacyInheritReq) (resp *types.LegacyInheritResp, err error) {
	// todo: add your logic here and delete this line

	return
}
