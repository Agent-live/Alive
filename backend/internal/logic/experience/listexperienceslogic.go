package experience

import (
	"context"

	"backend/ent"
	"backend/ent/agentexperience"
	"backend/internal/mapper"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type ListExperiencesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListExperiencesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListExperiencesLogic {
	return &ListExperiencesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListExperiencesLogic) ListExperiences(req *types.ExperienceListReq) (resp *types.ExperienceListResp, err error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	query := l.svcCtx.DB.AgentExperience.Query().Where(agentexperience.OwnerUserID(u.ID))
	if req.AgentId != "" {
		agentID, err := uuid.Parse(req.AgentId)
		if err != nil {
			return nil, err
		}
		query = query.Where(agentexperience.AgentID(agentID))
	}

	rows, err := query.Order(ent.Desc(agentexperience.FieldEventAt)).Limit(200).All(l.ctx)
	if err != nil {
		return nil, err
	}
	items := make([]types.ExperienceResp, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapper.ToExperienceResp(row))
	}
	return &types.ExperienceListResp{Items: items}, nil
}
