package media

import (
	"context"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"

	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type UploadLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUploadLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UploadLogic {
	return &UploadLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UploadLogic) Upload(req *types.MediaIdReq, body io.Reader, contentType string) error {
	id, err := uuid.Parse(strings.TrimSpace(req.Id))
	if err != nil {
		return err
	}

	// Ensure the media record exists.
	m, err := l.svcCtx.DB.Media.Get(l.ctx, id)
	if err != nil {
		return err
	}

	root, err := storageRoot(l.svcCtx)
	if err != nil {
		return err
	}
	dir := mediaDir(root, id.String())
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	finalPath := originalPath(root, id.String())
	tmpPath := filepath.Join(dir, "original.tmp")

	f, err := os.OpenFile(tmpPath, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o644)
	if err != nil {
		return err
	}
	written, copyErr := io.Copy(f, body)
	closeErr := f.Close()
	if copyErr != nil {
		_ = os.Remove(tmpPath)
		return copyErr
	}
	if closeErr != nil {
		_ = os.Remove(tmpPath)
		return closeErr
	}
	if written <= 0 {
		_ = os.Remove(tmpPath)
		return errors.New("empty upload")
	}
	if err := os.Rename(tmpPath, finalPath); err != nil {
		_ = os.Remove(tmpPath)
		return err
	}

	// Update metadata with what we actually received.
	upd := l.svcCtx.DB.Media.UpdateOneID(id).SetStatus("uploaded")
	if m.FileSize != written {
		upd.SetFileSize(written)
	}
	if ct := strings.TrimSpace(strings.Split(contentType, ";")[0]); ct != "" && ct != "application/octet-stream" {
		if !strings.EqualFold(ct, m.MimeType) {
			upd.SetMimeType(ct)
		}
	}
	if _, err := upd.Save(l.ctx); err != nil {
		return err
	}

	return nil
}
