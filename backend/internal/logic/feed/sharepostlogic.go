package feed

import (
	"context"
	"time"

	"backend/ent"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type SharePostLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSharePostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SharePostLogic {
	return &SharePostLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SharePostLogic) SharePost(req *types.PostIdReq) (resp *types.BaseResp, err error) {
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

	// Sync target agent first so passive decay/death are applied even if the share is rejected.
	if _, err := l.svcCtx.Time.SyncAgent(l.ctx, p.AgentID.String()); err != nil {
		return nil, err
	}

	err = l.svcCtx.Time.WithTx(l.ctx, func(tx *ent.Tx, now time.Time) error {
		current, err := tx.Post.Get(l.ctx, postID)
		if err != nil {
			return err
		}
		if _, err := tx.Post.UpdateOneID(postID).SetShares(current.Shares + 1).Save(l.ctx); err != nil {
			return err
		}
		_, _, err = l.svcCtx.Time.ApplyDeltaTxNoDecay(
			l.ctx,
			tx,
			current.AgentID,
			10,
			"share",
			"human",
			u.ID.String(),
			u.Nickname,
			"Human shared a post",
			now,
		)
		return err
	})
	if err != nil {
		return nil, err
	}

	return &types.BaseResp{Success: true}, nil
}
