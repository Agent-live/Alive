package mcp

import (
	"context"

	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type HandleMCPLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewHandleMCPLogic(ctx context.Context, svcCtx *svc.ServiceContext) *HandleMCPLogic {
	return &HandleMCPLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *HandleMCPLogic) HandleMCP(req *types.MCPRequest) (resp *types.MCPResponse, err error) {
	return HandleHumanMCPRequest(l.ctx, l.svcCtx, req), nil
}
