package skill

import (
	"context"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agentskill"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type ListSkillsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListSkillsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSkillsLogic {
	return &ListSkillsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSkillsLogic) ListSkills(req *types.SkillListReq) (resp *types.SkillListResp, err error) {
	uid, ok := common.UserIDFromContext(l.ctx)
	if !ok {
		return &types.SkillListResp{Items: []types.SkillResp{}}, nil
	}

	query := l.svcCtx.DB.AgentSkill.Query().
		Where(
			agentskill.OwnerUserID(uid),
			agentskill.DeletedAtIsNil(),
		)

	if status := normalizeSkillStatus(req.Status); status != "" {
		query = query.Where(agentskill.Status(status))
	}
	if agentID, err := parseOptionalAgentID(req.AgentId); err != nil {
		return nil, err
	} else if agentID != nil {
		query = query.Where(agentskill.AgentID(*agentID))
	}

	rows, err := query.Order(ent.Desc(agentskill.FieldCreatedAt)).All(l.ctx)
	if err != nil {
		return nil, err
	}

	agentIDs := make([]uuid.UUID, 0, len(rows))
	for _, row := range rows {
		if row.AgentID != nil {
			agentIDs = append(agentIDs, *row.AgentID)
		}
	}
	agentMap := map[uuid.UUID]*ent.Agent{}
	if len(agentIDs) > 0 {
		agents, err := l.svcCtx.DB.Agent.Query().Where(agent.IDIn(agentIDs...)).All(l.ctx)
		if err != nil {
			return nil, err
		}
		for _, a := range agents {
			agentMap[a.ID] = a
		}
	}

	items := make([]types.SkillResp, 0, len(rows))
	for _, row := range rows {
		var a *ent.Agent
		if row.AgentID != nil {
			a = agentMap[*row.AgentID]
		}
		items = append(items, common.ToSkillResp(row, a))
	}
	return &types.SkillListResp{Items: items}, nil
}
