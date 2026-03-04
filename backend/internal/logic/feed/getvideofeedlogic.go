package feed

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/post"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetVideoFeedLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetVideoFeedLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetVideoFeedLogic {
	return &GetVideoFeedLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetVideoFeedLogic) GetVideoFeed(req *types.FeedListReq) (resp *types.PostListResp, err error) {
	page, pageSize, offset := domain.NormalizePage(req.Page, req.PageSize)

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	videoFilter := post.ContentContains(`"type":"video"`)

	total, err := l.svcCtx.DB.Post.Query().Where(videoFilter).Count(l.ctx)
	if err != nil {
		return nil, err
	}

	posts, err := l.svcCtx.DB.Post.Query().
		Where(videoFilter).
		Order(ent.Desc(post.FieldCreatedAt)).
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
