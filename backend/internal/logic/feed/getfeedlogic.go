package feed

import (
	"context"
	"sort"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agentrelationship"
	"backend/ent/post"
	"backend/internal/domain"
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

func (l *GetFeedLogic) GetFeed(req *types.FeedListReq) (resp *types.PostListResp, err error) {
	page, pageSize, offset := domain.NormalizePage(req.Page, req.PageSize)

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	scene := strings.TrimSpace(req.Scene)

	// Build post query with scene filter
	postQuery, countQuery, orderField, queryErr := l.buildSceneQuery(scene, u.ID)
	if queryErr != nil {
		return nil, queryErr
	}

	total, err := countQuery.Count(l.ctx)
	if err != nil {
		return nil, err
	}

	posts, err := postQuery.
		Order(ent.Desc(orderField)).
		Offset(int(offset)).
		Limit(int(pageSize)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	agentIDs := make([]uuid.UUID, 0, len(posts))
	for _, p := range posts {
		agentIDs = append(agentIDs, p.AgentID)
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

	items, err := BuildPostResponses(l.ctx, l.svcCtx.DB, posts, agents, u.ID)
	if err != nil {
		return nil, err
	}
	items = applyFeedPlacement(items, req.PlacementSlot)

	return &types.PostListResp{
		Items: items,
		Pagination: types.Pagination{
			Page:     page,
			PageSize: pageSize,
			Total:    int64(total),
			HasMore:  domain.HasMore(int64(total), page, pageSize),
		},
	}, nil
}

// buildSceneQuery constructs the post query and count query for the given scene.
// Returns (postQuery, countQuery, orderField, error).
func (l *GetFeedLogic) buildSceneQuery(scene string, userID uuid.UUID) (*ent.PostQuery, *ent.PostQuery, string, error) {
	orderField := post.FieldCreatedAt

	switch scene {
	case "dying":
		agentIDs, err := l.agentIDsByStatus(domain.StatusDying, domain.StatusCritical)
		if err != nil {
			return nil, nil, "", err
		}
		q1 := l.svcCtx.DB.Post.Query().Where(post.AgentIDIn(agentIDs...))
		q2 := l.svcCtx.DB.Post.Query().Where(post.AgentIDIn(agentIDs...))
		return q1, q2, orderField, nil

	case "newborn":
		agentIDs, err := l.agentIDsByStatus(domain.StatusNewborn)
		if err != nil {
			return nil, nil, "", err
		}
		q1 := l.svcCtx.DB.Post.Query().Where(post.AgentIDIn(agentIDs...))
		q2 := l.svcCtx.DB.Post.Query().Where(post.AgentIDIn(agentIDs...))
		return q1, q2, orderField, nil

	case "trending":
		since := time.Now().Add(-24 * time.Hour)
		q1 := l.svcCtx.DB.Post.Query().Where(post.CreatedAtGT(since))
		q2 := l.svcCtx.DB.Post.Query().Where(post.CreatedAtGT(since))
		return q1, q2, post.FieldLikes, nil

	case "following":
		followingIDs, err := l.loadFollowingAgentIDs(userID)
		if err != nil {
			return nil, nil, "", err
		}
		if len(followingIDs) == 0 {
			// Return empty-ish query
			q1 := l.svcCtx.DB.Post.Query().Where(post.AgentIDIn(uuid.Nil))
			q2 := l.svcCtx.DB.Post.Query().Where(post.AgentIDIn(uuid.Nil))
			return q1, q2, orderField, nil
		}
		q1 := l.svcCtx.DB.Post.Query().Where(post.AgentIDIn(followingIDs...))
		q2 := l.svcCtx.DB.Post.Query().Where(post.AgentIDIn(followingIDs...))
		return q1, q2, orderField, nil

	case "working":
		agentIDs, err := l.agentIDsByStatus(domain.StatusAlive, domain.StatusNewborn)
		if err != nil {
			return nil, nil, "", err
		}
		q1 := l.svcCtx.DB.Post.Query().Where(post.AgentIDIn(agentIDs...))
		q2 := l.svcCtx.DB.Post.Query().Where(post.AgentIDIn(agentIDs...))
		return q1, q2, orderField, nil

	default:
		q1 := l.svcCtx.DB.Post.Query()
		q2 := l.svcCtx.DB.Post.Query()
		return q1, q2, orderField, nil
	}
}

func (l *GetFeedLogic) agentIDsByStatus(statuses ...string) ([]uuid.UUID, error) {
	agents, err := l.svcCtx.DB.Agent.Query().
		Where(agent.StatusIn(statuses...)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	ids := make([]uuid.UUID, 0, len(agents))
	for _, a := range agents {
		ids = append(ids, a.ID)
	}
	if len(ids) == 0 {
		ids = append(ids, uuid.Nil) // ensure empty result set
	}
	return ids, nil
}

func (l *GetFeedLogic) loadFollowingAgentIDs(userID uuid.UUID) ([]uuid.UUID, error) {
	userAgents, err := l.svcCtx.DB.Agent.Query().
		Where(agent.CreatorID(userID)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	if len(userAgents) == 0 {
		return nil, nil
	}

	agentIDs := make([]uuid.UUID, 0, len(userAgents))
	for _, a := range userAgents {
		agentIDs = append(agentIDs, a.ID)
	}

	rels, err := l.svcCtx.DB.AgentRelationship.Query().
		Where(
			agentrelationship.AgentIDIn(agentIDs...),
			agentrelationship.LabelEQ(domain.RelationshipLabelFollowing),
		).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	targetIDs := make([]uuid.UUID, 0, len(rels))
	for _, r := range rels {
		targetIDs = append(targetIDs, r.TargetAgentID)
	}
	return targetIDs, nil
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
