package media

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetUploadURLLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetUploadURLLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUploadURLLogic {
	return &GetUploadURLLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUploadURLLogic) GetUploadURL(req *types.UploadURLReq) (resp *types.UploadURLResp, err error) {
	if strings.TrimSpace(req.FileName) == "" {
		return nil, errors.New("fileName is required")
	}
	if strings.TrimSpace(req.MimeType) == "" {
		return nil, errors.New("mimeType is required")
	}
	if req.FileSize <= 0 {
		return nil, errors.New("fileSize must be positive")
	}

	m, err := l.svcCtx.DB.Media.Create().
		SetMimeType(req.MimeType).
		SetFileSize(req.FileSize).
		SetStatus("uploading").
		Save(l.ctx)
	if err != nil {
		return nil, err
	}

	return &types.UploadURLResp{
		MediaId:   m.ID.String(),
		UploadURL: fmt.Sprintf("https://media.alive.bot/upload/%s", m.ID.String()),
		ExpiresIn: 600,
	}, nil
}
