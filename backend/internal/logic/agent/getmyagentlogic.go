package agent

import (
	"context"
	"errors"

	"backend/ent/channelconnection"
	"backend/internal/mapper"
	"backend/internal/selector"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetMyAgentLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMyAgentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMyAgentLogic {
	return &GetMyAgentLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMyAgentLogic) GetMyAgent() (resp *types.AgentResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	a, err := selector.ResolveDefaultOwnedAgentForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err != nil {
		return nil, errors.New("agent not found")
	}
	if l.svcCtx.Time != nil {
		if synced, syncErr := l.svcCtx.Time.SyncAgent(l.ctx, a.ID.String()); syncErr != nil {
			l.Errorf("get my agent: sync agent %s failed: %v", a.ID.String(), syncErr)
		} else if synced != nil {
			a = synced
		}
	}

	channels, err := l.svcCtx.DB.ChannelConnection.Query().Where(channelconnection.AgentID(a.ID)).All(l.ctx)
	if err != nil {
		return nil, err
	}

	out := mapper.ToAgentResp(a, u.Nickname, channels)
	return &out, nil
}
