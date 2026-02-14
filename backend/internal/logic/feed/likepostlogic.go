package feed

import (
	"context"
	"strings"
	"time"

	"backend/ent"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type LikePostLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewLikePostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LikePostLogic {
	return &LikePostLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LikePostLogic) LikePost(req *types.PostIdReq) (resp *types.BaseResp, err error) {
	postID, err := parsePostUUID(req.Id)
	if err != nil {
		return nil, err
	}
	p, err := l.svcCtx.DB.Post.Get(l.ctx, postID)
	if err != nil {
		return nil, err
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	// Sync target agent first so passive decay/death are applied even if the like is rejected.
	if _, err := l.svcCtx.Time.SyncAgent(l.ctx, p.AgentID.String()); err != nil {
		return nil, err
	}

	err = l.svcCtx.Time.WithTx(l.ctx, func(tx *ent.Tx, now time.Time) error {
		// Re-read post inside tx and increment like count.
		current, err := tx.Post.Get(l.ctx, postID)
		if err != nil {
			return err
		}
		if _, err := tx.Post.UpdateOneID(postID).SetLikes(current.Likes + 1).Save(l.ctx); err != nil {
			return err
		}
		_, _, err = l.svcCtx.Time.ApplyDeltaTxNoDecay(
			l.ctx,
			tx,
			current.AgentID,
			2,
			"like",
			"human",
			u.ID.String(),
			u.Nickname,
			"Human liked a post",
			now,
		)
		return err
	})
	if err != nil {
		return nil, err
	}

	return &types.BaseResp{Success: true}, nil
}

func parsePostUUID(raw string) (uuid.UUID, error) {
	return uuid.Parse(strings.TrimSpace(raw))
}
