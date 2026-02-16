package media

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"

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

	// Ensure the upload actually exists on disk.
	root, err := storageRoot(l.svcCtx)
	if err != nil {
		return nil, err
	}
	if _, err := os.Stat(originalPath(root, id.String())); err != nil {
		if os.IsNotExist(err) {
			return nil, errors.New("upload not found")
		}
		return nil, err
	}

	m, err := l.svcCtx.DB.Media.Get(l.ctx, id)
	if err != nil {
		return nil, err
	}

	publicURL := fmt.Sprintf("/api/v1/media/%s/original", id.String())
	upd := l.svcCtx.DB.Media.UpdateOneID(id).
		SetStatus("ready").
		SetURL(publicURL)
	// Only images get a thumbnail URL for now; video thumbnails can be added later.
	if strings.HasPrefix(strings.ToLower(strings.TrimSpace(m.MimeType)), "image/") {
		upd.SetThumbnailURL(publicURL)
	}
	m, err = upd.Save(l.ctx)
	if err != nil {
		return nil, err
	}
	out := common.ToMediaResp(m)
	return &out, nil
}
