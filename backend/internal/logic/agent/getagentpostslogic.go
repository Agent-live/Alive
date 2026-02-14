package agent

import (
	"context"

	"backend/ent"
	"backend/ent/post"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

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

	items := make([]types.PostResp, 0, len(posts))
	for _, p := range posts {
		items = append(items, common.ToPostResp(p, a))
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
