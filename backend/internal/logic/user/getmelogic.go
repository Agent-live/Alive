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

type GetMeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMeLogic {
	return &GetMeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMeLogic) GetMe() (resp *types.UserResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	agentID := ""
	a, err := selector.ResolveDefaultOwnedAgentForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err == nil && a != nil {
		agentID = a.ID.String()
	}

	out := mapper.ToUserResp(u, agentID)
	return &out, nil
}
