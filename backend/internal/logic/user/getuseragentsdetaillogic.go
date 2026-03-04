package user

import (
	"context"

	"backend/ent/channelconnection"
	"backend/internal/mapper"
	"backend/internal/selector"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetUserAgentsDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetUserAgentsDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserAgentsDetailLogic {
	return &GetUserAgentsDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUserAgentsDetailLogic) GetUserAgentsDetail() (resp *types.UserAgentsDetailResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	rows, err := selector.LoadOwnedAgentsForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err != nil {
		return nil, err
	}

	agents := make([]types.AgentResp, 0, len(rows))
	for _, a := range rows {
		if l.svcCtx.Time != nil {
			if synced, syncErr := l.svcCtx.Time.SyncAgent(l.ctx, a.ID.String()); syncErr == nil && synced != nil {
				a = synced
			}
		}
		channels, _ := l.svcCtx.DB.ChannelConnection.Query().
			Where(channelconnection.AgentID(a.ID)).
			All(l.ctx)
		out := mapper.ToAgentResp(a, u.Nickname, channels)
		agents = append(agents, out)
	}

	return &types.UserAgentsDetailResp{
		Agents: agents,
	}, nil
}
