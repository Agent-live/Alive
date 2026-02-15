package media

import (
	"context"
	"os"
	"strings"

	"backend/ent"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetOriginalLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetOriginalLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetOriginalLogic {
	return &GetOriginalLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetOriginalLogic) GetOriginal(req *types.MediaIdReq) (path string, mimeType string, err error) {
	id, err := uuid.Parse(strings.TrimSpace(req.Id))
	if err != nil {
		return "", "", err
	}

	m, err := l.svcCtx.DB.Media.Get(l.ctx, id)
	if err != nil {
		return "", "", err
	}

	root, err := storageRoot(l.svcCtx)
	if err != nil {
		return "", "", err
	}
	p := originalPath(root, id.String())
	if _, err := os.Stat(p); err != nil {
		// Match the API-wide error handler (404) without leaking filesystem details.
		return "", "", &ent.NotFoundError{}
	}
	return p, m.MimeType, nil
}
