package conversation

import (
	"context"
	"strings"

	"backend/internal/selector"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListConversationsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListConversationsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListConversationsLogic {
	return &ListConversationsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListConversationsLogic) ListConversations(req *types.ConversationListReq) (resp *types.ConversationListResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	chatType := ""
	preferredAgentID := ""
	if req != nil {
		chatType = strings.TrimSpace(req.ChatType)
		preferredAgentID = req.AgentId
	}
	myAgent, err := selector.ResolveOwnedAgentForUser(l.ctx, l.svcCtx.DB, u.ID, preferredAgentID)
	if err != nil {
		return nil, err
	}

	out, err := NewLogic(l.ctx, l.svcCtx).ListConversations(myAgent.ID, chatType)
	if err != nil {
		return nil, err
	}

	return mapConversationListResp(out), nil
}
