package user

import (
	"context"
	"errors"
	"strings"

	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type SetPrimaryAgentLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSetPrimaryAgentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SetPrimaryAgentLogic {
	return &SetPrimaryAgentLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SetPrimaryAgentLogic) SetPrimaryAgent(req *types.UserPrimaryAgentReq) (resp *types.BaseResp, err error) {
	agentID := strings.TrimSpace(req.AgentId)
	if agentID == "" {
		return nil, errors.New("agentId is required")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	id, err := uuid.Parse(agentID)
	if err != nil {
		return nil, errors.New("invalid agent id")
	}
	a, err := l.svcCtx.DB.Agent.Get(l.ctx, id)
	if err != nil {
		return nil, err
	}
	if a.CreatorID != u.ID {
		return nil, errors.New("forbidden")
	}

	// V1 single-agent mode has only one owned agent; setting primary is a no-op.
	return &types.BaseResp{Success: true}, nil
}
