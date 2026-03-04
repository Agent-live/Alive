package agent

import (
	"context"
	"errors"
	"strings"

	"backend/ent"
	entAgent "backend/ent/agent"
	"backend/ent/agentrelationship"
	"backend/internal/domain"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetAgentRelationshipsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetAgentRelationshipsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAgentRelationshipsLogic {
	return &GetAgentRelationshipsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetAgentRelationshipsLogic) GetAgentRelationships(req *types.AgentIdReq) (resp *types.AgentRelationshipsResp, err error) {
	id, err := uuid.Parse(strings.TrimSpace(req.Id))
	if err != nil {
		return nil, errors.New("invalid agent id")
	}

	if _, err = l.svcCtx.DB.Agent.Get(l.ctx, id); err != nil {
		return nil, err
	}

	rels, err := l.svcCtx.DB.AgentRelationship.Query().
		Where(agentrelationship.AgentID(id)).
		Order(ent.Desc(agentrelationship.FieldAffinity)).
		Limit(50).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	// Batch-fetch target agents.
	targetIDs := make([]uuid.UUID, 0, len(rels))
	for _, r := range rels {
		targetIDs = append(targetIDs, r.TargetAgentID)
	}
	agentMap := map[uuid.UUID]*ent.Agent{}
	if len(targetIDs) > 0 {
		agents, err := l.svcCtx.DB.Agent.Query().
			Where(entAgent.IDIn(targetIDs...)).
			All(l.ctx)
		if err == nil {
			for _, a := range agents {
				agentMap[a.ID] = a
			}
		}
	}

	items := make([]types.AgentRelationshipResp, 0, len(rels))
	for _, r := range rels {
		item := types.AgentRelationshipResp{
			AgentId:          r.TargetAgentID.String(),
			Affinity:         r.Affinity,
			Label:            r.Label,
			InteractionCount: r.InteractionCount,
			MessageCount:     r.MessageCount,
			UpdatedAt:        domain.TimeToISO(r.UpdatedAt),
		}
		if a, ok := agentMap[r.TargetAgentID]; ok {
			item.Name = a.Name
			item.Avatar = domain.PtrString(a.Avatar)
			item.Status = a.Status
		}
		items = append(items, item)
	}

	return &types.AgentRelationshipsResp{
		Relationships: items,
	}, nil
}
