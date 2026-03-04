package notification

import (
	"context"
	"time"

	"backend/ent"
	entAgent "backend/ent/agent"
	entConv "backend/ent/conversation"
	"backend/ent/conversationmessage"
	"backend/ent/conversationparticipant"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetUnreadCountLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetUnreadCountLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUnreadCountLogic {
	return &GetUnreadCountLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUnreadCountLogic) GetUnreadCount() (resp *types.UnreadCountResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	// Get all user-owned agents
	userAgents, err := l.svcCtx.DB.Agent.Query().
		Where(entAgent.CreatorID(u.ID)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	if len(userAgents) == 0 {
		return &types.UnreadCountResp{
			TotalUnread:         0,
			ConversationUnreads: []types.ConvUnreadItem{},
		}, nil
	}

	agentIDs := make([]uuid.UUID, 0, len(userAgents))
	for _, a := range userAgents {
		agentIDs = append(agentIDs, a.ID)
	}

	// Load all participations for user's agents
	participations, err := l.svcCtx.DB.ConversationParticipant.Query().
		Where(conversationparticipant.AgentIDIn(agentIDs...)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	if len(participations) == 0 {
		return &types.UnreadCountResp{
			TotalUnread:         0,
			ConversationUnreads: []types.ConvUnreadItem{},
		}, nil
	}

	convIDs := make([]uuid.UUID, 0, len(participations))
	lastReadMap := make(map[uuid.UUID]*time.Time, len(participations))
	for _, p := range participations {
		convIDs = append(convIDs, p.ConversationID)
		if p.LastReadAt != nil {
			t := *p.LastReadAt
			if existing, ok := lastReadMap[p.ConversationID]; !ok || (existing != nil && t.After(*existing)) {
				lastReadMap[p.ConversationID] = &t
			}
		} else if _, ok := lastReadMap[p.ConversationID]; !ok {
			lastReadMap[p.ConversationID] = nil
		}
	}

	// Load conversations
	convs, err := l.svcCtx.DB.Conversation.Query().
		Where(
			entConv.IDIn(convIDs...),
			entConv.Status(domain.ConversationStatusActive),
		).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	// Compute unread counts per conversation
	unreadMap := batchUnreadCounts(l.ctx, l.svcCtx.DB, convs, lastReadMap)

	var totalUnread int64
	convUnreads := make([]types.ConvUnreadItem, 0)
	for _, c := range convs {
		count := unreadMap[c.ID]
		if count > 0 {
			totalUnread += int64(count)
			convUnreads = append(convUnreads, types.ConvUnreadItem{
				ConversationId: c.ID.String(),
				UnreadCount:    int64(count),
			})
		}
	}

	return &types.UnreadCountResp{
		TotalUnread:         totalUnread,
		ConversationUnreads: convUnreads,
	}, nil
}

// batchUnreadCounts computes unread message counts for each conversation.
func batchUnreadCounts(ctx context.Context, db *ent.Client, convs []*ent.Conversation, lastReadMap map[uuid.UUID]*time.Time) map[uuid.UUID]int {
	result := make(map[uuid.UUID]int, len(convs))

	var needCount []uuid.UUID
	var readTimes []time.Time
	for _, c := range convs {
		lr, ok := lastReadMap[c.ID]
		if ok && lr != nil {
			needCount = append(needCount, c.ID)
			readTimes = append(readTimes, *lr)
		} else if ok {
			result[c.ID] = c.MessageCount
		}
	}

	if len(needCount) == 0 {
		return result
	}

	earliest := readTimes[0]
	for _, t := range readTimes[1:] {
		if t.Before(earliest) {
			earliest = t
		}
	}

	msgs, err := db.ConversationMessage.Query().
		Where(
			conversationmessage.ConversationIDIn(needCount...),
			conversationmessage.CreatedAtGT(earliest),
		).
		All(ctx)
	if err != nil {
		return result
	}

	readTimeMap := make(map[uuid.UUID]time.Time, len(needCount))
	for i, cid := range needCount {
		readTimeMap[cid] = readTimes[i]
	}

	for _, m := range msgs {
		rt, ok := readTimeMap[m.ConversationID]
		if !ok {
			continue
		}
		if m.CreatedAt.After(rt) {
			result[m.ConversationID]++
		}
	}

	return result
}
