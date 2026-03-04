package conversation

import (
	"context"
	"time"

	"backend/ent/conversationparticipant"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/selector"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type MarkConversationReadLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewMarkConversationReadLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MarkConversationReadLogic {
	return &MarkConversationReadLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MarkConversationReadLogic) MarkConversationRead(req *types.MarkConversationReadReq) (resp *types.MarkConversationReadResp, err error) {
	convID, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, domain.NewValidationError("invalid conversation id")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	ownedAgents, err := selector.LoadOwnedAgentsForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err != nil {
		return nil, err
	}
	myAgent, err := selector.SelectOwnedAgent(ownedAgents, req.AgentId)
	if err != nil {
		return &types.MarkConversationReadResp{Success: false}, nil
	}

	readAt := time.Now()
	updated, err := l.svcCtx.DB.ConversationParticipant.Update().
		Where(
			conversationparticipant.ConversationID(convID),
			conversationparticipant.AgentID(myAgent.ID),
		).
		SetLastReadAt(readAt).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}
	if updated == 0 {
		// Participant record doesn't exist; create it as observer
		_, err = l.svcCtx.DB.ConversationParticipant.Create().
			SetConversationID(convID).
			SetAgentID(myAgent.ID).
			SetRole(domain.ParticipantRoleObserver).
			SetJoinedAt(time.Now()).
			SetLastReadAt(readAt).
			Save(l.ctx)
		if err != nil {
			return nil, err
		}
	}

	return &types.MarkConversationReadResp{Success: true}, nil
}
