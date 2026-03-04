package media

import (
	"context"

	"backend/internal/mapper"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetMediaLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMediaLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMediaLogic {
	return &GetMediaLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMediaLogic) GetMedia(req *types.MediaIdReq) (resp *types.MediaResp, err error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, err
	}
	m, err := l.svcCtx.DB.Media.Get(l.ctx, id)
	if err != nil {
		return nil, err
	}
	out := mapper.ToMediaResp(m)
	return &out, nil
}
