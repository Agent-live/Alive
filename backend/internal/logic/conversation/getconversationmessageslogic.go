package conversation

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/aliveagent"
	"backend/internal/logic/common"
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
	myAgent, err := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID)).Only(l.ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, errors.New("agent not found")
		}
		return nil, err
	}

	out, err := NewLogic(l.ctx, l.svcCtx).GetMessages(myAgent.ID, req.Id, req.Page, req.PageSize)
	if err != nil {
		return nil, err
	}

	// Best-effort: record message-read signal for AliveAgent runtime.
	runtimeAgentID := strings.TrimSpace(common.PtrString(myAgent.AliveAgentRuntimeID))
	if runtimeAgentID != "" && l.svcCtx.AliveAgent != nil {
		_ = l.svcCtx.AliveAgent.NotifyStructuredEvent(l.ctx, aliveagent.StructuredNotifyRequest{
			RuntimeAgentID: runtimeAgentID,
			AgentID:        myAgent.ID.String(),
			EventType:      "discussion.message_read",
			Title:          "ALIVE Discussion Read",
			Message:        "Conversation messages viewed",
			SessionKey:     "alive:conversation:" + strings.TrimSpace(req.Id),
			DedupeKey: aliveagent.BuildDedupeKey(
				myAgent.ID.String(),
				"discussion.message_read",
				strings.TrimSpace(req.Id),
				fmt.Sprintf("page-%d", req.Page),
			),
			Payload: map[string]any{
				"conversationId": strings.TrimSpace(req.Id),
				"page":           req.Page,
				"pageSize":       req.PageSize,
				"returnedCount":  len(out.Items),
				"hasMore":        out.HasMore,
			},
			TimeoutSeconds: 60,
		})
	}

	return mapMessageListResp(out), nil
}
