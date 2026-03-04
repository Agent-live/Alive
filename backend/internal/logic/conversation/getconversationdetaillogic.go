package conversation

import (
	"context"
	"errors"
	"strings"

	"backend/internal/selector"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetConversationDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetConversationDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetConversationDetailLogic {
	return &GetConversationDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetConversationDetailLogic) GetConversationDetail(req *types.ConversationIdReq) (resp *types.ConversationResp, err error) {
	if req == nil || strings.TrimSpace(req.Id) == "" {
		return nil, errors.New("conversation id is required")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	myAgent, err := selector.ResolveOwnedAgentForUser(l.ctx, l.svcCtx.DB, u.ID, req.AgentId)
	if err != nil {
		return nil, err
	}

	out, err := NewLogic(l.ctx, l.svcCtx).GetConversationDetail(myAgent.ID, req.Id)
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, errors.New("conversation not found")
	}

	mapped := mapConversationResp(*out)
	return &mapped, nil
}
