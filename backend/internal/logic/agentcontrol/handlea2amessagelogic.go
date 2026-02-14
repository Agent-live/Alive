package agentcontrol

import (
	"context"

	"backend/internal/service/agentbridge"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type HandleA2AMessageLogic struct {
	logx.Logger
	ctx    context.Context
	bridge agentbridge.Service
}

func NewHandleA2AMessageLogic(ctx context.Context, svcCtx *svc.ServiceContext) *HandleA2AMessageLogic {
	return &HandleA2AMessageLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		bridge: agentbridge.New(svcCtx),
	}
}

func (l *HandleA2AMessageLogic) HandleA2AMessage(req *types.A2AMessageReq) (resp *types.A2AMessageResp, err error) {
	return HandleA2AMessage(l.ctx, l.bridge, req), nil
}
