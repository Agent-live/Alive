package user

import (
	"context"

	"backend/ent/agent"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetUserAgentsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetUserAgentsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserAgentsLogic {
	return &GetUserAgentsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUserAgentsLogic) GetUserAgents() (resp *types.UserAgentsResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	rows, err := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).All(l.ctx)
	if err != nil {
		return nil, err
	}

	agents := make([]types.AgentSummaryResp, 0, len(rows))
	for _, a := range rows {
		out := common.ToAgentSummaryResp(a)
		out.CreatorName = u.Nickname
		agents = append(agents, out)
	}

	primary := ""
	if len(rows) > 0 {
		primary = rows[0].ID.String()
	}

	return &types.UserAgentsResp{
		Agents:         agents,
		MaxSlots:       1, // V1 single-agent mode
		UsedSlots:      int64(len(agents)),
		PrimaryAgentId: primary,
	}, nil
}
