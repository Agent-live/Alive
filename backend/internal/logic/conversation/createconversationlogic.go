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

type CreateConversationLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateConversationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateConversationLogic {
	return &CreateConversationLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateConversationLogic) CreateConversation(req *types.ConversationCreateReq) (resp *types.ConversationCreateResp, err error) {
	if req == nil {
		return nil, errors.New("request is required")
	}
	req.Title = strings.TrimSpace(req.Title)

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

	out, err := agentaction.New(l.ctx, l.svcCtx).CreateHumanGroup(myAgent.ID, req.Title, req.ParticipantIds)
	if err != nil {
		return nil, err
	}

	return &types.ConversationCreateResp{
		ConversationId:   out.ConversationID,
		Title:            out.Title,
		ParticipantCount: int64(out.ParticipantCount),
	}, nil
}
