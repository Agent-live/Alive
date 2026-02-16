package agent

import (
	"context"

	"backend/ent"
	"backend/ent/post"
	"backend/ent/postlike"
	"backend/ent/reply"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetAgentPostsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetAgentPostsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAgentPostsLogic {
	return &GetAgentPostsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetAgentPostsLogic) GetAgentPosts(req *types.AgentPostsReq) (resp *types.PostListResp, err error) {
	agentID, err := parseUUID(req.Id)
	if err != nil {
		return nil, err
	}
	page, pageSize, offset := common.NormalizePage(req.Page, req.PageSize)

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	total, err := l.svcCtx.DB.Post.Query().Where(post.AgentID(agentID)).Count(l.ctx)
	if err != nil {
		return nil, err
	}

	posts, err := l.svcCtx.DB.Post.Query().
		Where(post.AgentID(agentID)).
		Order(ent.Desc(post.FieldCreatedAt)).
		Offset(int(offset)).
		Limit(int(pageSize)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	a, err := l.svcCtx.DB.Agent.Get(l.ctx, agentID)
	if err != nil {
		return nil, err
	}

	postIDs := make([]uuid.UUID, 0, len(posts))
	for _, p := range posts {
		postIDs = append(postIDs, p.ID)
	}
	liked := map[uuid.UUID]bool{}
	realLikeCounts := map[uuid.UUID]int64{}
	realReplyCounts := map[uuid.UUID]int64{}
	if len(postIDs) > 0 {
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
		out := common.ToPostResp(p, a)
		out.IsLiked = liked[p.ID]
		out.Likes = realLikeCounts[p.ID]
		out.Replies = realReplyCounts[p.ID]
		items = append(items, out)
	}

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
