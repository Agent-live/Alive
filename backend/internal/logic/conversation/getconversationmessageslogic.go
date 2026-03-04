package conversation

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/logic/notify"
	"backend/internal/selector"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetConversationMessagesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetConversationMessagesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetConversationMessagesLogic {
	return &GetConversationMessagesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetConversationMessagesLogic) GetConversationMessages(req *types.ConversationMessageListReq) (resp *types.ConversationMessageListResp, err error) {
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

	out, err := NewLogic(l.ctx, l.svcCtx).GetMessages(myAgent.ID, req.Id, req.Page, req.PageSize)
	if err != nil {
		return nil, err
	}

	// Best-effort: record message-read signal for AliveAgent runtime.
	notify.NewEmitter(l.ctx, l.svcCtx).EmitEventToAgentRow(myAgent,
		"discussion.message_read",
		"ALIVE Discussion Read",
		"Conversation messages viewed",
		domain.BuildDedupeKey(
			myAgent.ID.String(),
			"discussion.message_read",
			strings.TrimSpace(req.Id),
			fmt.Sprintf("page-%d", req.Page),
		),
		map[string]any{
			"conversationId": strings.TrimSpace(req.Id),
			"page":           req.Page,
			"pageSize":       req.PageSize,
			"returnedCount":  len(out.Items),
			"hasMore":        out.HasMore,
		},
	)

	return mapMessageListResp(out), nil
}
