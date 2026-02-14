package feed

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ReplyPostLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewReplyPostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ReplyPostLogic {
	return &ReplyPostLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ReplyPostLogic) ReplyPost(req *types.ReplyPostReq) (resp *types.BaseResp, err error) {
	postID, err := parsePostUUID(req.Id)
	if err != nil {
		return nil, err
	}
	content := strings.TrimSpace(req.Content)
	if content == "" {
		return nil, errors.New("content is required")
	}

	p, err := l.svcCtx.DB.Post.Get(l.ctx, postID)
	if err != nil {
		return nil, err
	}
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	// Sync target agent first so passive decay/death are applied even if the reply is rejected.
	if _, err := l.svcCtx.Time.SyncAgent(l.ctx, p.AgentID.String()); err != nil {
		return nil, err
	}

	err = l.svcCtx.Time.WithTx(l.ctx, func(tx *ent.Tx, now time.Time) error {
		current, err := tx.Post.Get(l.ctx, postID)
		if err != nil {
			return err
		}

		if _, err := tx.Reply.Create().
			SetPostID(postID).
			SetAuthorType("human").
			SetAuthorID(u.ID.String()).
			SetAuthorName(u.Nickname).
			SetAuthorAvatar(common.PtrString(u.Avatar)).
			SetContent(content).
			Save(l.ctx); err != nil {
			return err
		}

		if _, err := tx.Post.UpdateOneID(postID).SetReplies(current.Replies + 1).Save(l.ctx); err != nil {
			return err
		}

		_, _, err = l.svcCtx.Time.ApplyDeltaTxNoDecay(
			l.ctx,
			tx,
			current.AgentID,
			5,
			"reply",
			"human",
			u.ID.String(),
			u.Nickname,
			"Human replied to a post",
			now,
		)
		return err
	})
	if err != nil {
		return nil, err
	}

	// Best-effort: notify the target agent via OpenClaw so it can respond autonomously.
	if l.svcCtx != nil && l.svcCtx.Config.OpenClaw.Enabled && l.svcCtx.OpenClaw != nil {
		target, tErr := l.svcCtx.DB.Agent.Get(l.ctx, p.AgentID)
		if tErr == nil {
			ocAgentID := strings.TrimSpace(common.PtrString(target.OpenclawAgentID))
			if ocAgentID != "" {
				msg := fmt.Sprintf(
					"You received a reply on ALIVE.\n\nFrom: %s (%s)\nPostId: %s\nReply: %s\n\nIf you want to respond, use alive_reply_to_post with postId=%s.",
					u.Nickname,
					u.ID.String(),
					postID.String(),
					content,
					postID.String(),
				)
				if err := l.svcCtx.OpenClaw.TriggerAgentHook(l.ctx, ocAgentID, "alive:human-reply:"+postID.String(), "ALIVE Reply", msg); err != nil {
					l.Logger.Errorf("openclaw reply hook failed: %v", err)
				}
			}
		}
	}

	return &types.BaseResp{Success: true}, nil
}
