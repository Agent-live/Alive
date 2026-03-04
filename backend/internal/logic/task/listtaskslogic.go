package task

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agenttask"
	"backend/internal/mapper"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type ListTasksLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListTasksLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListTasksLogic {
	return &ListTasksLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListTasksLogic) ListTasks(req *types.TaskListReq) (resp *types.TaskListResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	// Get all agent IDs belonging to the current user.
	agentQuery := l.svcCtx.DB.Agent.Query().Where(agent.CreatorID(u.ID))
	if req.AgentId != "" {
		agentID, err := uuid.Parse(req.AgentId)
		if err != nil {
			return nil, err
		}
		agentQuery = agentQuery.Where(agent.ID(agentID))
	}
	agents, err := agentQuery.All(l.ctx)
	if err != nil {
		return nil, err
	}
	if len(agents) == 0 {
		return &types.TaskListResp{Items: []types.TaskResp{}}, nil
	}

	agentIDs := make([]uuid.UUID, 0, len(agents))
	agentMap := make(map[uuid.UUID]*ent.Agent, len(agents))
	for _, a := range agents {
		agentIDs = append(agentIDs, a.ID)
		agentMap[a.ID] = a
	}

	query := l.svcCtx.DB.AgentTask.Query().
		Where(
			agenttask.AgentIDIn(agentIDs...),
			agenttask.DeletedAtIsNil(),
		).
		Order(ent.Desc(agenttask.FieldCreatedAt)).
		Limit(200)

	if req.Status != "" {
		query = query.Where(agenttask.Status(req.Status))
	}

	rows, err := query.All(l.ctx)
	if err != nil {
		return nil, err
	}

	items := make([]types.TaskResp, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapper.ToTaskResp(row, agentMap[row.AgentID]))
	}
	return &types.TaskListResp{Items: items}, nil
}
