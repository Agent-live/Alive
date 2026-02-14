package channel

import (
	"context"
	"errors"

	"backend/ent/channelconnection"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type ListChannelsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListChannelsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListChannelsLogic {
	return &ListChannelsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListChannelsLogic) ListChannels(req *types.ChannelReq) (resp *types.ChannelListResp, err error) {
	aid, err := uuid.Parse(req.AgentId)
	if err != nil {
		return nil, errors.New("invalid agent id")
	}

	items, err := l.svcCtx.DB.ChannelConnection.Query().Where(channelconnection.AgentID(aid)).All(l.ctx)
	if err != nil {
		return nil, err
	}

	channels := make([]types.ChannelItemResp, 0, len(items))
	for _, c := range items {
		channels = append(channels, types.ChannelItemResp{
			Type:        c.ChannelType,
			Status:      c.Status,
			Handle:      deref(c.Handle),
			DeepLink:    deref(c.DeepLink),
			ConnectedAt: formatTime(c.ConnectedAt),
		})
	}
	return &types.ChannelListResp{Channels: channels}, nil
}
