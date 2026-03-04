package conversation

import (
	"context"

	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type Logic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
	q      *QueryOps
}

func NewLogic(ctx context.Context, svcCtx *svc.ServiceContext) *Logic {
	return &Logic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
		q:      NewQueryOps(ctx, svcCtx),
	}
}

// ListConversations returns all conversations for the user's agent.
func (l *Logic) ListConversations(agentID uuid.UUID, chatType string) (*ConversationListResp, error) {
	return l.q.ListConversations(agentID, chatType)
}

// GetConversationDetail returns a single conversation with participants.
func (l *Logic) GetConversationDetail(agentID uuid.UUID, convIDStr string) (*ConversationResp, error) {
	return l.q.GetConversationDetail(agentID, convIDStr)
}

// GetMessages returns paginated messages for a conversation.
func (l *Logic) GetMessages(agentID uuid.UUID, convIDStr string, page, pageSize int64) (*MessageListResp, error) {
	return l.q.GetMessages(agentID, convIDStr, page, pageSize)
}
