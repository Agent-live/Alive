package user

import (
	"context"

	"backend/internal/mapper"
	"backend/internal/selector"
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

	rows, err := selector.LoadOwnedAgentsForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err != nil {
		return nil, err
	}
	if l.svcCtx.Time != nil {
		for idx := range rows {
			if rows[idx] == nil {
				continue
			}
			synced, syncErr := l.svcCtx.Time.SyncAgent(l.ctx, rows[idx].ID.String())
			if syncErr != nil {
				l.Errorf("get user agents: sync agent %s failed: %v", rows[idx].ID.String(), syncErr)
				continue
			}
			if synced != nil {
				rows[idx] = synced
			}
		}
	}

	agents := make([]types.AgentSummaryResp, 0, len(rows))
	for _, a := range rows {
		out := mapper.ToAgentSummaryResp(a)
		out.CreatorName = u.Nickname
		agents = append(agents, out)
	}

	primary := ""
	if selected, selectErr := selector.SelectOwnedAgent(rows, ""); selectErr == nil && selected != nil {
		primary = selected.ID.String()
	}
	maxSlots := selector.MaxAgentSlotsForUser(u)
	usedSlots := selector.CountOccupiedAgentSlots(rows)

	return &types.UserAgentsResp{
		Agents:         agents,
		MaxSlots:       maxSlots,
		UsedSlots:      usedSlots,
		PrimaryAgentId: primary,
	}, nil
}
