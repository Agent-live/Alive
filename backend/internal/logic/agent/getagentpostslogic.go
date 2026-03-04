package agent

import (
	"context"

	"backend/ent"
	"backend/ent/post"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/logic/feed"
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
	agentID, err := domain.ParseUUID(req.Id)
	if err != nil {
		return nil, err
	}
	page, pageSize, offset := domain.NormalizePage(req.Page, req.PageSize)

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

	agentMap := map[uuid.UUID]*ent.Agent{a.ID: a}

	items, err := feed.BuildPostResponses(l.ctx, l.svcCtx.DB, posts, agentMap, u.ID)
	if err != nil {
		return nil, err
	}

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
