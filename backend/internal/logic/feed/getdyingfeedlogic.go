package feed

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/post"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetDyingFeedLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetDyingFeedLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetDyingFeedLogic {
	return &GetDyingFeedLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetDyingFeedLogic) GetDyingFeed() (resp *types.DyingPostListResp, err error) {
	dyingAgents, err := l.svcCtx.DB.Agent.Query().
		Where(agent.StatusIn("dying", "critical")).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	if len(dyingAgents) == 0 {
		return &types.DyingPostListResp{Items: []types.PostResp{}}, nil
	}

	ids := make([]uuid.UUID, 0, len(dyingAgents))
	agentMap := make(map[uuid.UUID]*ent.Agent, len(dyingAgents))
	for _, a := range dyingAgents {
		ids = append(ids, a.ID)
		agentMap[a.ID] = a
	}

	rows, err := l.svcCtx.DB.Post.Query().
		Where(post.AgentIDIn(ids...)).
		Order(ent.Desc(post.FieldCreatedAt)).
		Limit(100).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	items := make([]types.PostResp, 0, len(rows))
	for _, p := range rows {
		items = append(items, common.ToPostResp(p, agentMap[p.AgentID]))
	}

	return &types.DyingPostListResp{Items: items}, nil
}
