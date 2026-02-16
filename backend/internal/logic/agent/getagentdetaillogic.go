package agent

import (
	"context"

	"backend/ent/channelconnection"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetAgentDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetAgentDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAgentDetailLogic {
	return &GetAgentDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetAgentDetailLogic) GetAgentDetail(req *types.AgentIdReq) (resp *types.AgentResp, err error) {
	agentID, err := parseUUID(req.Id)
	if err != nil {
		return nil, err
	}
	a, err := l.svcCtx.DB.Agent.Get(l.ctx, agentID)
	if err != nil {
		return nil, err
	}
	u, err := l.svcCtx.DB.User.Get(l.ctx, a.CreatorID)
	if err != nil {
		return nil, err
	}
	channels, err := l.svcCtx.DB.ChannelConnection.Query().Where(channelconnection.AgentID(a.ID)).All(l.ctx)
	if err != nil {
		return nil, err
	}
	out := common.ToAgentResp(a, u.Nickname, channels)
	return &out, nil
}
