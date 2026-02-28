package media

import (
	"context"
	"errors"
	"mime"
	"os"
	"path/filepath"
	"strings"

	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetAssetLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetAssetLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAssetLogic {
	return &GetAssetLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetAssetLogic) GetAsset(req *types.MediaAssetReq) (path string, mimeType string, err error) {
	name := sanitizeAssetName(req.Name)
	if name == "" {
		return "", "", errors.New("invalid asset name")
	}

	filePath, err := findAssetPath(name)
	if err != nil {
		return "", "", err
	}

	mimeType = mime.TypeByExtension(strings.ToLower(filepath.Ext(name)))
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	return filePath, mimeType, nil
}

func sanitizeAssetName(raw string) string {
	name := strings.TrimSpace(raw)
	if name == "" {
		return ""
	}
	base := filepath.Base(name)
	if base == "." || base == ".." || base == "" {
		return ""
	}
	if strings.Contains(base, "/") || strings.Contains(base, "\\") {
		return ""
	}
	return base
}

func findAssetPath(name string) (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	// Search order favors backend-local assets first, then Frontend public assets.
	candidates := []string{
		filepath.Join(wd, "..", "assets", name),
		filepath.Join(wd, "assets", name),
		filepath.Join(wd, "..", "Frontend", "Alive-app", "public", "assets", name),
	}
	for _, candidate := range candidates {
		cleanPath := filepath.Clean(candidate)
		if info, statErr := os.Stat(cleanPath); statErr == nil && !info.IsDir() {
			return cleanPath, nil
		}
	}
	return "", errors.New("asset not found")
}
