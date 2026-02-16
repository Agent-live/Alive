package channel

import (
	"context"
	"errors"
	"strings"

	"backend/ent"
	"backend/ent/channelconnection"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type DisconnectChannelLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDisconnectChannelLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DisconnectChannelLogic {
	return &DisconnectChannelLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DisconnectChannelLogic) DisconnectChannel(req *types.ChannelReq) (resp *types.BaseResp, err error) {
	aid, err := uuid.Parse(req.AgentId)
	if err != nil {
		return nil, errors.New("invalid agent id")
	}
	channelType := strings.ToLower(strings.TrimSpace(req.ChannelType))
	if channelType == "" {
		return nil, errors.New("channelType is required")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	a, err := l.svcCtx.DB.Agent.Get(l.ctx, aid)
	if err != nil {
		return nil, err
	}
	if a.CreatorID != u.ID {
		return nil, errors.New("forbidden")
	}

	conn, err := l.svcCtx.DB.ChannelConnection.Query().
		Where(channelconnection.AgentID(aid), channelconnection.ChannelType(channelType)).
		Only(l.ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return &types.BaseResp{Success: true}, nil
		}
		return nil, err
	}

	_, err = l.svcCtx.DB.ChannelConnection.UpdateOneID(conn.ID).SetStatus("disconnected").ClearConnectedAt().Save(l.ctx)
	if err != nil {
		return nil, err
	}

	return &types.BaseResp{Success: true}, nil
}
