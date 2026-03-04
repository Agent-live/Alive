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
	participantIDs := normalizeParticipantIDs(req.ParticipantIds)
	if len(participantIDs) == 0 {
		return nil, errors.New("at least 1 participant is required")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	myAgent, err := selector.ResolveOwnedAgentForUser(l.ctx, l.svcCtx.DB, u.ID, req.AgentId)
	if err != nil {
		return nil, err
	}

	actions := NewAgentOps(l.ctx, l.svcCtx)
	var out *CreateGroupResp
	if len(participantIDs) == 1 {
		out, err = actions.CreateHumanDirect(myAgent.ID, participantIDs[0])
	} else {
		out, err = actions.CreateHumanGroup(myAgent.ID, req.Title, participantIDs)
	}
	if err != nil {
		return nil, err
	}

	return &types.ConversationCreateResp{
		ConversationId:   out.ConversationID,
		Title:            out.Title,
		ParticipantCount: int64(out.ParticipantCount),
	}, nil
}

func normalizeParticipantIDs(ids []string) []string {
	if len(ids) == 0 {
		return nil
	}
	out := make([]string, 0, len(ids))
	seen := make(map[string]struct{}, len(ids))
	for _, raw := range ids {
		id := strings.TrimSpace(raw)
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
