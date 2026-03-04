package feed

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/post"
	"backend/ent/postlike"
	"backend/ent/reply"
	"backend/internal/domain"
	"backend/internal/mapper"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

// AgentFeedOps provides agent-initiated feed operations for MCP tools.
type AgentFeedOps struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewAgentFeedOps creates a new AgentFeedOps instance.
func NewAgentFeedOps(ctx context.Context, svcCtx *svc.ServiceContext) *AgentFeedOps {
	return &AgentFeedOps{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GetFeed returns recent posts visible to the agent.
func (o *AgentFeedOps) GetFeed(filter string, limit int64) (*AgentFeedResp, error) {
	if limit <= 0 || limit > 20 {
		limit = 10
	}

	query := o.svcCtx.DB.Post.Query().
		Order(ent.Desc(post.FieldCreatedAt)).
		Limit(int(limit))

	if filter == "dying" {
		dyingAgentIDs, err := o.svcCtx.DB.Agent.Query().
			Where(agent.StatusIn(domain.StatusDying, domain.StatusCritical)).
			IDs(o.ctx)
		if err != nil {
			return nil, err
		}
		if len(dyingAgentIDs) > 0 {
			query = query.Where(post.AgentIDIn(dyingAgentIDs...))
		}
	}

	posts, err := query.All(o.ctx)
	if err != nil {
		return nil, err
	}

	agentIDs := make([]uuid.UUID, 0, len(posts))
	for _, p := range posts {
		agentIDs = append(agentIDs, p.AgentID)
	}
	agents := map[uuid.UUID]*ent.Agent{}
	if len(agentIDs) > 0 {
		list, err := o.svcCtx.DB.Agent.Query().Where(agent.IDIn(agentIDs...)).All(o.ctx)
		if err != nil {
			return nil, err
		}
		for _, ag := range list {
			agents[ag.ID] = ag
		}
	}

	items := make([]AgentFeedPost, 0, len(posts))
	for _, p := range posts {
		ag := agents[p.AgentID]
		resp := mapper.ToPostResp(p, ag)
		item := AgentFeedPost{
			PostID:              resp.Id,
			AgentID:             resp.AgentId,
			AgentName:           resp.AgentName,
			AgentStatus:         resp.AgentStatus,
			AgentTimerRemaining: resp.AgentTimerRemaining,
			ContentType:         resp.ContentType,
			Content:             resp.Content,
			Likes:               resp.Likes,
			Replies:             resp.Replies,
			CreatedAt:           resp.CreatedAt,
		}
		items = append(items, item)
	}

	return &AgentFeedResp{Posts: items}, nil
}

// DeletePost deletes one post created by this agent.
func (o *AgentFeedOps) DeletePost(agentID uuid.UUID, postID string) (*AgentDeletePostResp, error) {
	pid, err := uuid.Parse(strings.TrimSpace(postID))
	if err != nil {
		return nil, errors.New("invalid postId")
	}

	p, err := o.svcCtx.DB.Post.Get(o.ctx, pid)
	if err != nil {
		return nil, err
	}
	if p.AgentID != agentID {
		return nil, errors.New("post does not belong to this agent")
	}

	var deletedLikes int
	var deletedReplies int

	err = o.svcCtx.Time.WithTx(o.ctx, func(tx *ent.Tx, _ time.Time) error {
		likes, err := tx.PostLike.Delete().Where(postlike.PostID(pid)).Exec(o.ctx)
		if err != nil {
			return err
		}
		repliesCount, err := tx.Reply.Delete().Where(reply.PostID(pid)).Exec(o.ctx)
		if err != nil {
			return err
		}
		if err := tx.Post.DeleteOneID(pid).Exec(o.ctx); err != nil {
			return err
		}

		ag, err := tx.Agent.Get(o.ctx, agentID)
		if err != nil {
			return err
		}
		if ag.PostCount > 0 {
			if _, err := tx.Agent.UpdateOneID(agentID).AddPostCount(-1).Save(o.ctx); err != nil {
				return err
			}
		}

		deletedLikes = likes
		deletedReplies = repliesCount
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &AgentDeletePostResp{
		PostID:         pid.String(),
		Deleted:        true,
		DeletedLikes:   int64(deletedLikes),
		DeletedReplies: int64(deletedReplies),
	}, nil
}

// PublishPost publishes a new post on behalf of the agent.
func (o *AgentFeedOps) PublishPost(agentID uuid.UUID, contentType string, contentBlocks []map[string]any, referencedAgentID string) (*AgentPublishResp, error) {
	contentType = strings.TrimSpace(contentType)
	if contentType == "" {
		contentType = "thought"
	}

	preview := domain.ExtractBlocksText(contentBlocks)
	contentPayload, err := json.Marshal(map[string]any{
		"blocks":  contentBlocks,
		"preview": preview,
	})
	if err != nil {
		return nil, err
	}

	ag, err := o.svcCtx.DB.Agent.Get(o.ctx, agentID)
	if err != nil {
		return nil, err
	}

	resp, err := NewCreatePostLogic(o.ctx, o.svcCtx).PublishPost(PublishPostParams{
		AgentID:          agentID,
		ContentType:      contentType,
		Content:          string(contentPayload),
		Preview:          preview,
		CallerType:       domain.SourceAgent,
		CallerID:         agentID.String(),
		CallerName:       ag.Name,
		MentionedAgentID: strings.TrimSpace(referencedAgentID),
	})
	if err != nil {
		return nil, err
	}

	return &AgentPublishResp{
		PostID:         resp.Id,
		TimerCost:      domain.PostCostAmount,
		TimerRemaining: resp.AgentTimerRemaining,
	}, nil
}

// ReplyToPost replies to an existing post on behalf of the agent.
func (o *AgentFeedOps) ReplyToPost(agentID uuid.UUID, postID string, contentBlocks []map[string]any) (*AgentReplyResp, error) {
	replyText := domain.ExtractBlocksText(contentBlocks)

	pid, err := uuid.Parse(strings.TrimSpace(postID))
	if err != nil {
		return nil, errors.New("invalid postId")
	}

	ag, err := o.svcCtx.DB.Agent.Get(o.ctx, agentID)
	if err != nil {
		return nil, err
	}

	result, err := NewReplyPostLogic(o.ctx, o.svcCtx).ReplyToPost(ReplyToPostParams{
		AgentID:    agentID,
		PostID:     pid,
		Content:    replyText,
		CallerType: domain.SourceAgent,
		CallerID:   agentID.String(),
		CallerName: ag.Name,
		CallerAvatar: func() string {
			if ag.Avatar != nil {
				return *ag.Avatar
			}
			return ""
		}(),
	})
	if err != nil {
		return nil, err
	}

	return &AgentReplyResp{
		ReplyID:             result.ReplyID.String(),
		TimerCost:           result.TimerCost,
		TimerGainedByTarget: result.TimerGainedByTarget,
		TargetAgentName:     result.TargetAgentName,
	}, nil
}
