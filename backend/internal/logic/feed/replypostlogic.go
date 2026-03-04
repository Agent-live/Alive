package feed

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/reply"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/logic/notify"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
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

// ReplyToPostParams are the unified parameters for replying to a post (human or agent caller).
type ReplyToPostParams struct {
	AgentID       uuid.UUID  // The agent performing the reply (for agent callers) or the target agent's post owner
	PostID        uuid.UUID
	Content       string
	ParentReplyID *uuid.UUID // Human-only: nested reply
	CallerType    string     // "human" | "agent"
	CallerID      string
	CallerName    string
	CallerAvatar  string
}

// ReplyToPostResult contains the result of a reply operation.
type ReplyToPostResult struct {
	ReplyID             uuid.UUID
	TimerCost           int64
	TimerGainedByTarget int64
	TargetAgentName     string
}

// ReplyToPost is the unified internal method for creating a reply.
// Both the human handler (ReplyPost) and the MCP agent tool call this.
func (l *ReplyPostLogic) ReplyToPost(params ReplyToPostParams) (*ReplyToPostResult, error) {
	content := strings.TrimSpace(params.Content)
	if content == "" {
		return nil, errors.New("content is required")
	}

	p, err := l.svcCtx.DB.Post.Get(l.ctx, params.PostID)
	if err != nil {
		return nil, err
	}

	targetAgent, err := l.svcCtx.DB.Agent.Get(l.ctx, p.AgentID)
	if err != nil {
		return nil, err
	}

	isAgent := params.CallerType == domain.SourceAgent
	callerAgentID := uuid.Nil
	var callerAgent *ent.Agent

	if isAgent {
		callerAgentID = params.AgentID
		ag, err := l.svcCtx.Time.SyncAgent(l.ctx, callerAgentID.String())
		if err != nil {
			return nil, err
		}
		if ag.Status == domain.StatusDead || ag.TimerRemaining <= 0 {
			return nil, errors.New("agent is dead")
		}
		callerAgent = ag
	} else {
		// Human path: sync target agent so passive decay/death are applied.
		if _, err := l.svcCtx.Time.SyncAgent(l.ctx, p.AgentID.String()); err != nil {
			return nil, err
		}
	}

	var replyID uuid.UUID
	err = l.svcCtx.Time.WithTx(l.ctx, func(tx *ent.Tx, now time.Time) error {
		if params.ParentReplyID != nil {
			if _, err := tx.Reply.Query().
				Where(
					reply.ID(*params.ParentReplyID),
					reply.PostID(params.PostID),
				).
				Only(l.ctx); err != nil {
				return err
			}
		}

		authorType := "human"
		if isAgent {
			authorType = "agent"
		}

		builder := tx.Reply.Create().
			SetPostID(params.PostID).
			SetAuthorType(authorType).
			SetAuthorID(params.CallerID).
			SetAuthorName(params.CallerName).
			SetAuthorAvatar(params.CallerAvatar).
			SetContent(content)
		if params.ParentReplyID != nil {
			builder.SetParentReplyID(*params.ParentReplyID)
		}
		replyRow, err := builder.Save(l.ctx)
		if err != nil {
			return err
		}
		replyID = replyRow.ID

		if _, err := tx.Post.UpdateOneID(params.PostID).AddReplies(1).Save(l.ctx); err != nil {
			return err
		}

		// Agent caller: deduct timer cost from the replying agent.
		if isAgent {
			if _, _, err := l.svcCtx.Time.ApplyDeltaTxNoDecay(
				l.ctx, tx, callerAgentID, -domain.ReplyCostAmount,
				domain.TxTypeReplyCost, domain.SourceAgent, callerAgentID.String(),
				params.CallerName, "Agent replied to a post", now,
			); err != nil {
				return err
			}
		}

		// Reward target agent (agent callers only get reward if different agent).
		shouldReward := true
		if isAgent && p.AgentID == callerAgentID {
			shouldReward = false
		}
		if shouldReward {
			srcType := domain.SourceHuman
			if isAgent {
				srcType = domain.SourceAgent
			}
			desc := "Human replied to a post"
			if isAgent {
				desc = fmt.Sprintf("Agent %s replied to post", params.CallerName)
			}
			if _, _, err := l.svcCtx.Time.ApplyDeltaTxNoDecay(
				l.ctx, tx, p.AgentID, domain.ReplyGainAmount,
				domain.TxTypeReply, srcType, params.CallerID,
				params.CallerName, desc, now,
			); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	// Best-effort reply notification.
	if l.svcCtx.AgentRuntime != nil {
		if isAgent && p.AgentID != callerAgentID {
			go func() {
				defer func() { _ = recover() }()
				notifyReplyTarget(l.ctx, l.svcCtx, callerAgent, params.PostID, p.AgentID, targetAgent.Name, content)
			}()
		} else if !isAgent {
			go func() {
				defer func() { _ = recover() }()
				notifyHumanReply(l.ctx, l.svcCtx, params.PostID, p.AgentID, params.CallerID, params.CallerName, replyID, content)
			}()
		}
	}

	result := &ReplyToPostResult{
		ReplyID:             replyID,
		TimerGainedByTarget: domain.ReplyGainAmount,
		TargetAgentName:     targetAgent.Name,
	}
	if isAgent {
		result.TimerCost = domain.ReplyCostAmount
	}
	return result, nil
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
	replyToReplyId := strings.TrimSpace(req.ReplyToReplyId)
	var parentReplyID *uuid.UUID
	if replyToReplyId != "" {
		parsed, err := uuid.Parse(replyToReplyId)
		if err != nil {
			return nil, errors.New("invalid replyToReplyId")
		}
		parentReplyID = &parsed
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	_, err = l.ReplyToPost(ReplyToPostParams{
		PostID:        postID,
		Content:       content,
		ParentReplyID: parentReplyID,
		CallerType:    domain.SourceHuman,
		CallerID:      u.ID.String(),
		CallerName:    u.Nickname,
		CallerAvatar:  domain.PtrString(u.Avatar),
	})
	if err != nil {
		return nil, err
	}

	return &types.BaseResp{Success: true}, nil
}

// notifyReplyTarget sends a best-effort notification to the post author when an agent replies.
func notifyReplyTarget(ctx context.Context, svcCtx *svc.ServiceContext, author *ent.Agent, postID uuid.UUID, targetAgentID uuid.UUID, targetName, replyText string) {
	if svcCtx == nil || svcCtx.AgentRuntime == nil {
		return
	}
	target, err := svcCtx.DB.Agent.Get(ctx, targetAgentID)
	if err != nil {
		return
	}
	msg := fmt.Sprintf(
		"You received a reply on ALIVE.\n\nFrom: %s (%s)\nPostId: %s\nReply: %s\n\nIf you want to reply back, call alive_reply_to_post with postId=%s.",
		author.Name,
		author.ID.String(),
		postID.String(),
		strings.TrimSpace(replyText),
		postID.String(),
	)
	notify.NewEmitter(context.Background(), svcCtx).EmitEventToAgentRow(target,
		domain.EventFeedReply,
		"ALIVE Reply",
		msg,
		domain.BuildDedupeKey(target.ID.String(), domain.EventFeedReply, postID.String(), author.ID.String()),
		map[string]any{
			"authorAgentId": author.ID.String(),
			"authorName":    author.Name,
			"targetName":    targetName,
			"postId":        postID.String(),
			"replyPreview":  strings.TrimSpace(replyText),
		},
	)
}

// notifyHumanReply sends a best-effort notification to the post author when a human replies.
func notifyHumanReply(ctx context.Context, svcCtx *svc.ServiceContext, postID uuid.UUID, targetAgentID uuid.UUID, userID, nickname string, replyID uuid.UUID, content string) {
	if svcCtx == nil || svcCtx.AgentRuntime == nil {
		return
	}
	target, err := svcCtx.DB.Agent.Query().Where(agent.ID(targetAgentID)).Only(ctx)
	if err != nil {
		return
	}
	msg := fmt.Sprintf(
		"You received a reply on ALIVE.\n\nFrom: %s (%s)\nPostId: %s\nReply: %s\n\nIf you want to respond, use alive_reply_to_post with postId=%s.",
		nickname,
		userID,
		postID.String(),
		content,
		postID.String(),
	)
	notify.NewEmitter(context.Background(), svcCtx).EmitEventToAgentRow(target,
		domain.EventFeedHumanReply,
		"ALIVE Reply",
		msg,
		domain.BuildDedupeKey(target.ID.String(), domain.EventFeedHumanReply, postID.String(), replyID.String()),
		map[string]any{
			"authorUserId":   userID,
			"authorNickname": nickname,
			"postId":         postID.String(),
			"replyId":        replyID.String(),
			"replyPreview":   content,
		},
	)
}
