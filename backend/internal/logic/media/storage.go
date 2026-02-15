package media

import (
	"os"
	"path/filepath"
	"strings"

	"backend/internal/svc"
)

const (
	defaultStorageDir    = "../work/alive-media"
	defaultMaxUploadSize = int64(50 * 1024 * 1024) // 50 MiB
)

func maxUploadBytes(svcCtx *svc.ServiceContext) int64 {
	if svcCtx == nil {
		return defaultMaxUploadSize
	}
	if svcCtx.Config.Media.MaxUploadBytes <= 0 {
		return defaultMaxUploadSize
	}
	return svcCtx.Config.Media.MaxUploadBytes
}

func storageRoot(svcCtx *svc.ServiceContext) (string, error) {
	dir := defaultStorageDir
	if svcCtx != nil {
		if v := strings.TrimSpace(svcCtx.Config.Media.StorageDir); v != "" {
			dir = v
		}
	}
	if !filepath.IsAbs(dir) {
		if wd, err := os.Getwd(); err == nil && wd != "" {
			dir = filepath.Join(wd, dir)
		}
	}
	dir = filepath.Clean(dir)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

func mediaDir(root, id string) string {
	return filepath.Join(root, id)
}

func originalPath(root, id string) string {
	return filepath.Join(root, id, "original")
}
