package media

import (
	"context"
	"fmt"

	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type ConfirmUploadLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewConfirmUploadLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ConfirmUploadLogic {
	return &ConfirmUploadLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ConfirmUploadLogic) ConfirmUpload(req *types.MediaIdReq) (resp *types.MediaResp, err error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, err
	}
	m, err := l.svcCtx.DB.Media.UpdateOneID(id).
		SetStatus("ready").
		SetURL(fmt.Sprintf("https://media.alive.bot/%s/original", id.String())).
		SetThumbnailURL(fmt.Sprintf("https://media.alive.bot/%s/thumb", id.String())).
		Save(l.ctx)
	if err != nil {
		return nil, err
	}
	out := common.ToMediaResp(m)
	return &out, nil
}
