package user

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
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
	a, err := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).Only(l.ctx)
	if err == nil {
		agentID = a.ID.String()
	} else if err != nil && !ent.IsNotFound(err) {
		return nil, err
	}

	out := common.ToUserResp(u, agentID)
	return &out, nil
}
