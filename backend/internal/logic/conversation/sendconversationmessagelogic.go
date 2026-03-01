package conversation

import (
	"context"
	"errors"
	"strings"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/logic/agentaction"
	"backend/internal/logic/common"
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
		return nil, errors.New("request is required")
	}
	req.Id = strings.TrimSpace(req.Id)
	if req.Id == "" {
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

	out, err := agentaction.New(l.ctx, l.svcCtx).SendGroupMessageWithAttachments(
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
	out := make([]string, 0, len(in))
	seen := make(map[string]struct{}, len(in))
	for _, item := range in {
		id := strings.TrimSpace(item.MediaId)
		if id == "" {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out
}
