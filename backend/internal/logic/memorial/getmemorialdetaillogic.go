package memorial

import (
	"context"

	"backend/ent"
	"backend/ent/tribute"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetMemorialDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMemorialDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMemorialDetailLogic {
	return &GetMemorialDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMemorialDetailLogic) GetMemorialDetail(req *types.MemorialIdReq) (resp *types.MemorialResp, err error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, err
	}

	m, err := l.svcCtx.DB.Memorial.Get(l.ctx, id)
	if err != nil {
		return nil, err
	}
	tributes, err := l.svcCtx.DB.Tribute.Query().Where(tribute.MemorialID(m.ID)).Order(ent.Asc(tribute.FieldCreatedAt)).All(l.ctx)
	if err != nil {
		return nil, err
	}
	a, _ := l.svcCtx.DB.Agent.Get(l.ctx, m.AgentID)
	creatorName := ""
	if a != nil {
		if u, err := l.svcCtx.DB.User.Get(l.ctx, a.CreatorID); err == nil {
			creatorName = u.Nickname
		}
	}
	out := common.ToMemorialRespDetailed(m, tributes, a, creatorName, int64(len(tributes)))
	return &out, nil
}
