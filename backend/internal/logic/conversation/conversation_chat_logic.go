package conversation

import (
	"context"

	chatlogic "backend/internal/logic/chat"
	"backend/internal/logic/common"
	"backend/internal/mapper"
	"backend/internal/selector"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ConversationChatLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewConversationChatLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ConversationChatLogic {
	return &ConversationChatLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ConversationChatLogic) ConversationChat(req *types.ConversationChatReq) (resp *types.ConversationChatResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	ag, err := selector.ResolveOwnedAgentForUser(l.ctx, l.svcCtx.DB, u.ID, req.AgentId)
	if err != nil {
		return nil, err
	}

	// Resolve media attachments.
	var mediaIDs []string
	for _, att := range req.Attachments {
		mediaIDs = append(mediaIDs, att.MediaId)
	}
	mediaEntries, err := mapper.LoadReadyMedia(l.ctx, l.svcCtx.DB, mapper.DedupeMediaIDs(mediaIDs))
	if err != nil {
		return nil, err
	}
	attachments := mapper.ResolveRichAttachments(mediaEntries)

	result, err := chatlogic.SendMessage(l.ctx, l.svcCtx, chatlogic.SendMessageInput{
		UserID:      u.ID,
		Agent:       ag,
		UserText:    req.Content,
		Attachments: attachments,
	})
	if err != nil {
		return nil, err
	}

	return &types.ConversationChatResp{
		ConversationId: result.ConversationID,
		MessageId:      result.MessageID,
		Reply:          result.Reply,
		CreatedAt:      result.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}
