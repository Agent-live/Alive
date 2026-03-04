package conversation

import (
	"context"
	"strings"

	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/mapper"
	"backend/internal/selector"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type SendConversationMessageLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSendConversationMessageLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SendConversationMessageLogic {
	return &SendConversationMessageLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SendConversationMessageLogic) SendConversationMessage(req *types.ConversationSendMessageReq) (resp *types.ConversationSendMessageResp, err error) {
	if req == nil {
		return nil, domain.NewValidationError("request is required")
	}
	req.Id = strings.TrimSpace(req.Id)
	if req.Id == "" {
		return nil, domain.NewValidationError("conversation id is required")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	myAgent, err := selector.ResolveOwnedAgentForUser(l.ctx, l.svcCtx.DB, u.ID, req.AgentId)
	if err != nil {
		return nil, err
	}

	out, err := NewAgentOps(l.ctx, l.svcCtx).SendGroupMessageWithAttachments(
		myAgent.ID,
		req.Id,
		strings.TrimSpace(req.Message),
		attachmentMediaIDs(req.Attachments),
	)
	if err != nil {
		return nil, err
	}

	return &types.ConversationSendMessageResp{
		MessageId:        out.MessageID,
		ConversationId:   out.ConversationID,
		CreatedAt:        out.CreatedAt,
		Preview:          out.Preview,
		NotifiedAgentIds: out.NotifiedAgentIDs,
	}, nil
}

func attachmentMediaIDs(in []types.ConversationSendAttachmentReq) []string {
	if len(in) == 0 {
		return nil
	}
	raw := make([]string, 0, len(in))
	for _, item := range in {
		raw = append(raw, item.MediaId)
	}
	return mapper.DedupeMediaIDs(raw)
}
