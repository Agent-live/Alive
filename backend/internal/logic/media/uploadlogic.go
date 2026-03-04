package media

import (
	"context"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"

	"backend/ent"
	"backend/internal/domain"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

const (
	uploadTmpFileName  = "original.tmp"
	uploadPartFileName = "original.part"
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
	id, m, err := l.parseAndGetMedia(req)
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
	tmpPath := filepath.Join(dir, uploadTmpFileName)
	partPath := filepath.Join(dir, uploadPartFileName)

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

	maxBytes := maxUploadBytes(l.svcCtx)
	if written > maxBytes {
		_ = os.Remove(tmpPath)
		return &FileTooLargeError{
			MaxBytes: maxBytes,
			Size:     written,
		}
	}

	if err := os.Rename(tmpPath, finalPath); err != nil {
		_ = os.Remove(tmpPath)
		return err
	}
	_ = os.Remove(partPath)

	if err := l.updateUploadedMetadata(id, m, written, contentType); err != nil {
		return err
	}
	return nil
}

func (l *UploadLogic) CurrentOffset(req *types.MediaIdReq) (offset int64, completed bool, err error) {
	id, _, err := l.parseAndGetMedia(req)
	if err != nil {
		return 0, false, err
	}

	root, err := storageRoot(l.svcCtx)
	if err != nil {
		return 0, false, err
	}
	dir := mediaDir(root, id.String())
	finalPath := originalPath(root, id.String())
	partPath := filepath.Join(dir, uploadPartFileName)

	if st, statErr := os.Stat(finalPath); statErr == nil {
		return st.Size(), true, nil
	} else if !os.IsNotExist(statErr) {
		return 0, false, statErr
	}

	if st, statErr := os.Stat(partPath); statErr == nil {
		return st.Size(), false, nil
	} else if !os.IsNotExist(statErr) {
		return 0, false, statErr
	}

	return 0, false, nil
}

func (l *UploadLogic) UploadChunk(
	req *types.MediaIdReq,
	body io.Reader,
	contentType string,
	offset int64,
	complete bool,
) (nextOffset int64, completed bool, err error) {
	if offset < 0 {
		return 0, false, errors.New("offset must be non-negative")
	}

	id, m, err := l.parseAndGetMedia(req)
	if err != nil {
		return 0, false, err
	}

	root, err := storageRoot(l.svcCtx)
	if err != nil {
		return 0, false, err
	}
	dir := mediaDir(root, id.String())
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return 0, false, err
	}

	finalPath := originalPath(root, id.String())
	partPath := filepath.Join(dir, uploadPartFileName)

	// If already finalized, report current final size for idempotent resumes.
	if st, statErr := os.Stat(finalPath); statErr == nil {
		finalSize := st.Size()
		if offset != finalSize {
			return 0, false, &UploadOffsetMismatchError{
				CurrentOffset: finalSize,
				Expected:      offset,
			}
		}
		return finalSize, true, nil
	} else if !os.IsNotExist(statErr) {
		return 0, false, statErr
	}

	var current int64
	if st, statErr := os.Stat(partPath); statErr == nil {
		current = st.Size()
	} else if !os.IsNotExist(statErr) {
		return 0, false, statErr
	}

	if offset != current {
		return 0, false, &UploadOffsetMismatchError{
			CurrentOffset: current,
			Expected:      offset,
		}
	}

	f, err := os.OpenFile(partPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return 0, false, err
	}
	written, copyErr := io.Copy(f, body)
	closeErr := f.Close()
	if copyErr != nil {
		return 0, false, copyErr
	}
	if closeErr != nil {
		return 0, false, closeErr
	}
	if written < 0 {
		return 0, false, errors.New("invalid chunk size")
	}

	next := current + written
	maxBytes := maxUploadBytes(l.svcCtx)
	if next > maxBytes {
		return 0, false, &FileTooLargeError{
			MaxBytes: maxBytes,
			Size:     next,
		}
	}
	if m.FileSize > 0 && next > m.FileSize {
		return 0, false, &FileTooLargeError{
			MaxBytes: m.FileSize,
			Size:     next,
		}
	}

	shouldFinalize := complete || (m.FileSize > 0 && next == m.FileSize)
	if !shouldFinalize {
		return next, false, nil
	}
	if m.FileSize > 0 && next < m.FileSize {
		return 0, false, &UploadIncompleteError{
			Current:  next,
			Expected: m.FileSize,
		}
	}

	_ = os.Remove(finalPath)
	if err := os.Rename(partPath, finalPath); err != nil {
		return 0, false, err
	}
	if err := l.updateUploadedMetadata(id, m, next, contentType); err != nil {
		return 0, false, err
	}
	return next, true, nil
}

func (l *UploadLogic) parseAndGetMedia(req *types.MediaIdReq) (uuid.UUID, *ent.Media, error) {
	id, err := uuid.Parse(strings.TrimSpace(req.Id))
	if err != nil {
		return uuid.Nil, nil, err
	}
	m, err := l.svcCtx.DB.Media.Get(l.ctx, id)
	if err != nil {
		return uuid.Nil, nil, err
	}
	return id, m, nil
}

func (l *UploadLogic) updateUploadedMetadata(id uuid.UUID, m *ent.Media, size int64, contentType string) error {
	upd := l.svcCtx.DB.Media.UpdateOneID(id).SetStatus(domain.MediaStatusUploaded)
	if m == nil || m.FileSize != size {
		upd.SetFileSize(size)
	}
	if ct := strings.TrimSpace(strings.Split(contentType, ";")[0]); ct != "" && ct != "application/octet-stream" {
		if m == nil || !strings.EqualFold(ct, m.MimeType) {
			upd.SetMimeType(ct)
		}
	}
	if _, err := upd.Save(l.ctx); err != nil {
		return err
	}
	return nil
}
