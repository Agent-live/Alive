package feed

import (
	"context"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/postlike"
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

func (l *LikePostLogic) LikePost(req *types.PostIdReq) (resp *types.LikePostResp, err error) {
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

	liked := false
	likes := int64(0)
	agentID := p.AgentID
	applyTimerBonus := false
	timerApplied := false
	timerGiven := int64(0)
	newTimerRemaining := int64(0)
	timerError := ""

	err = l.svcCtx.Time.WithTx(l.ctx, func(tx *ent.Tx, now time.Time) error {
		existing, err := tx.PostLike.Query().
			Where(
				postlike.PostID(postID),
				postlike.UserID(u.ID),
			).
			Only(l.ctx)
		if err == nil {
			// Unlike (no timer delta).
			if err := tx.PostLike.DeleteOneID(existing.ID).Exec(l.ctx); err != nil {
				return err
			}
			liked = false
		} else if ent.IsNotFound(err) {
			// Like — create PostLike record.
			if _, err := tx.PostLike.Create().
				SetPostID(postID).
				SetUserID(u.ID).
				SetCreatedAt(now.UTC()).
				Save(l.ctx); err != nil {
				return err
			}
			liked = true
			applyTimerBonus = true
		} else {
			return err
		}

		// Count actual PostLike records so Post.Likes is always accurate.
		count, err := tx.PostLike.Query().Where(postlike.PostID(postID)).Count(l.ctx)
		if err != nil {
			return err
		}
		likes = int64(count)
		if _, err := tx.Post.UpdateOneID(postID).SetLikes(likes).Save(l.ctx); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	// Apply timer bonus outside the core like transaction so a timer-engine
	// failure (e.g. agent already dead) does not roll back the like itself.
	if applyTimerBonus {
		var updated *ent.Agent
		if err := l.svcCtx.Time.WithTx(l.ctx, func(tx *ent.Tx, now time.Time) error {
			a, _, err := l.svcCtx.Time.ApplyDeltaTxNoDecay(
				l.ctx,
				tx,
				agentID,
				2,
				"like",
				"human",
				u.ID.String(),
				u.Nickname,
				"Human liked a post",
				now,
			)
			if err == nil {
				updated = a
			}
			return err
		}); err != nil {
			l.Errorf("failed to apply timer bonus for like on post %s: %v", postID, err)
			timerApplied = false
			timerGiven = 0
			timerError = err.Error()
		} else if updated != nil {
			timerApplied = true
			timerGiven = 2
			newTimerRemaining = updated.TimerRemaining
		}
	}

	return &types.LikePostResp{
		Success:           true,
		Liked:             liked,
		Likes:             likes,
		TimerApplied:      timerApplied,
		TimerGiven:        timerGiven,
		NewTimerRemaining: newTimerRemaining,
		TimerError:        timerError,
	}, nil
}

func parsePostUUID(raw string) (uuid.UUID, error) {
	return uuid.Parse(strings.TrimSpace(raw))
}
