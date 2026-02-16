package agentcontrol

import (
	"context"

	"backend/internal/service/agentbridge"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type HandleMCPLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
	bridge agentbridge.Service
}

func NewHandleMCPLogic(ctx context.Context, svcCtx *svc.ServiceContext) *HandleMCPLogic {
	return &HandleMCPLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
		bridge: agentbridge.New(svcCtx),
	}
}

func (l *HandleMCPLogic) HandleMCP(req *types.MCPRequest) (resp *types.MCPResponse, err error) {
	return HandleHumanMCPRequest(l.ctx, l.bridge, req), nil
}
