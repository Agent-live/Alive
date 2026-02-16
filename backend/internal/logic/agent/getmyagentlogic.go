package agent

import (
	"context"
	"errors"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/channelconnection"
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
	a, err := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).Only(l.ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, errors.New("agent not found")
		}
		return nil, err
	}

	channels, err := l.svcCtx.DB.ChannelConnection.Query().Where(channelconnection.AgentID(a.ID)).All(l.ctx)
	if err != nil {
		return nil, err
	}

	out := common.ToAgentResp(a, u.Nickname, channels)
	return &out, nil
}
