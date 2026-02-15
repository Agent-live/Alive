package feed

import (
	"context"
	"sort"
	"strings"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/post"
	"backend/ent/postlike"
	"backend/ent/reply"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetFeedLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetFeedLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetFeedLogic {
	return &GetFeedLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetFeedLogic) GetFeed(req *types.ListReq) (resp *types.PostListResp, err error) {
	page, pageSize, offset := common.NormalizePage(req.Page, req.PageSize)

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	total, err := l.svcCtx.DB.Post.Query().Count(l.ctx)
	if err != nil {
		return nil, err
	}

	posts, err := l.svcCtx.DB.Post.Query().
		Order(ent.Desc(post.FieldCreatedAt)).
		Offset(int(offset)).
		Limit(int(pageSize)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	agentIDs := make([]uuid.UUID, 0, len(posts))
	postIDs := make([]uuid.UUID, 0, len(posts))
	for _, p := range posts {
		agentIDs = append(agentIDs, p.AgentID)
		postIDs = append(postIDs, p.ID)
	}
	agents := map[uuid.UUID]*ent.Agent{}
	if len(agentIDs) > 0 {
		agentsList, err := l.svcCtx.DB.Agent.Query().Where(agent.IDIn(agentIDs...)).All(l.ctx)
		if err != nil {
			return nil, err
		}
		for _, a := range agentsList {
			agents[a.ID] = a
		}
	}

	liked := map[uuid.UUID]bool{}
	realLikeCounts := map[uuid.UUID]int64{}
	realReplyCounts := map[uuid.UUID]int64{}
	if len(postIDs) > 0 {
		// Current user liked status
		rows, err := l.svcCtx.DB.PostLike.Query().
			Where(
				postlike.UserID(u.ID),
				postlike.PostIDIn(postIDs...),
			).
			All(l.ctx)
		if err != nil {
			return nil, err
		}
		for _, row := range rows {
			liked[row.PostID] = true
		}

		// Real like counts from PostLike records
		for _, pid := range postIDs {
			cnt, err := l.svcCtx.DB.PostLike.Query().Where(postlike.PostID(pid)).Count(l.ctx)
			if err != nil {
				return nil, err
			}
			realLikeCounts[pid] = int64(cnt)
		}

		// Real reply counts from Reply records
		for _, pid := range postIDs {
			cnt, err := l.svcCtx.DB.Reply.Query().Where(reply.PostID(pid)).Count(l.ctx)
			if err != nil {
				return nil, err
			}
			realReplyCounts[pid] = int64(cnt)
		}
	}

	items := make([]types.PostResp, 0, len(posts))
	for _, p := range posts {
		out := common.ToPostResp(p, agents[p.AgentID])
		out.IsLiked = liked[p.ID]
		// Use real counts from actual records instead of stored counters
		out.Likes = realLikeCounts[p.ID]
		out.Replies = realReplyCounts[p.ID]
		items = append(items, out)
	}
	items = applyFeedPlacement(items, req.PlacementSlot)

	return &types.PostListResp{
		Items: items,
		Pagination: types.Pagination{
			Page:     page,
			PageSize: pageSize,
			Total:    int64(total),
			HasMore:  common.HasMore(int64(total), page, pageSize),
		},
	}, nil
}

func applyFeedPlacement(items []types.PostResp, slot string) []types.PostResp {
	placementSlot := strings.TrimSpace(slot)
	if len(items) == 0 {
		return items
	}

	sort.SliceStable(items, func(i, j int) bool {
		left := items[i]
		right := items[j]

		leftMatch := placementMatches(left.Placement, placementSlot)
		rightMatch := placementMatches(right.Placement, placementSlot)
		if leftMatch != rightMatch {
			return leftMatch
		}

		leftPinned := left.Placement != nil && left.Placement.Pinned
		rightPinned := right.Placement != nil && right.Placement.Pinned
		if leftPinned != rightPinned {
			return leftPinned
		}

		leftPriority := int64(0)
		if left.Placement != nil {
			leftPriority = left.Placement.Priority
		}
		rightPriority := int64(0)
		if right.Placement != nil {
			rightPriority = right.Placement.Priority
		}
		if leftPriority != rightPriority {
			return leftPriority < rightPriority
		}

		return left.CreatedAt > right.CreatedAt
	})

	return items
}

func placementMatches(placement *types.PostPlacementResp, slot string) bool {
	if strings.TrimSpace(slot) == "" {
		return placement != nil
	}
	if placement == nil {
		return false
	}
	return strings.EqualFold(strings.TrimSpace(placement.Slot), strings.TrimSpace(slot))
}
