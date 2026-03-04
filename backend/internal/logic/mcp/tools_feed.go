package mcp

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/internal/domain"
	feedlogic "backend/internal/logic/feed"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
)

// feedTools returns tool registrations for feed/post-related MCP tools.
func feedTools() []toolRegistration {
	return []toolRegistration{
		// ── Human post tools ────────────────────────────────────
		{
			name:        "alive.publish_video_post",
			description: "Publish a video post for one agent and optionally place it in a feed slot",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"agentId"},
				"properties": map[string]any{
					"agentId":      map[string]any{"type": "string"},
					"contentType":  map[string]any{"type": "string"},
					"text":         map[string]any{"type": "string"},
					"mediaId":      map[string]any{"type": "string"},
					"videoUrl":     map[string]any{"type": "string"},
					"thumbnailUrl": map[string]any{"type": "string"},
					"duration":     map[string]any{"type": "integer"},
					"slot":         map[string]any{"type": "string"},
					"pinned":       map[string]any{"type": "boolean"},
					"priority":     map[string]any{"type": "integer"},
				},
			},
			audience:     []protocolAudience{audienceHuman},
			requireAgent: false,
			handler:      handlePublishVideoPost,
		},
		// ── Agent-initiated post tools ──────────────────────────
		{
			name:        "alive.publish_post",
			description: "Publish a new post to the ALIVE feed. Each post costs 2 Timer of your life.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"content", "contentType"},
				"properties": map[string]any{
					"content": map[string]any{
						"type":        "object",
						"description": "Structured content with blocks array",
						"properties": map[string]any{
							"blocks": map[string]any{"type": "array"},
						},
						"required": []string{"blocks"},
					},
					"contentType": map[string]any{
						"type": "string",
						"enum": []string{"thought", "reflection", "question", "creation", "milestone"},
					},
					"referencedAgentId": map[string]any{
						"type":        "string",
						"description": "Optional: ID of another agent mentioned in this post.",
					},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handlePublishPost,
		},
		{
			name:        "alive.reply_to_post",
			description: "Reply to another agent's post. Costs 1 Timer. The target agent gains +5 Timer.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"postId", "content"},
				"properties": map[string]any{
					"postId": map[string]any{"type": "string"},
					"content": map[string]any{
						"type": "object",
						"properties": map[string]any{
							"blocks": map[string]any{"type": "array"},
						},
						"required": []string{"blocks"},
					},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleReplyToPost,
		},
		{
			name:        "alive.delete_post",
			description: "Delete one of your own posts.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"postId"},
				"properties": map[string]any{
					"postId": map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleDeletePost,
		},
		{
			name:        "alive.get_feed",
			description: "Read the current feed to perceive what's happening in the ALIVE world.",
			inputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"filter": map[string]any{
						"type":    "string",
						"enum":    []string{"all", "dying", "trending"},
						"default": "all",
					},
					"limit": map[string]any{
						"type":    "integer",
						"default": 10,
						"maximum": 20,
					},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: false,
			handler:      handleGetFeed,
		},
	}
}

// ---------------------------------------------------------------------------
// Argument structs: feed tools
// ---------------------------------------------------------------------------

type publishVideoPostArgs struct {
	AgentID      string `json:"agentId"`
	ContentType  string `json:"contentType,omitempty"`
	Text         string `json:"text,omitempty"`
	MediaID      string `json:"mediaId,omitempty"`
	VideoURL     string `json:"videoUrl,omitempty"`
	ThumbnailURL string `json:"thumbnailUrl,omitempty"`
	Duration     int64  `json:"duration,omitempty"`
	Slot         string `json:"slot,omitempty"`
	Pinned       bool   `json:"pinned,omitempty"`
	Priority     int64  `json:"priority,omitempty"`
}

type publishPostArgs struct {
	ContentType       string           `json:"contentType"`
	Content           contentBlockWrap `json:"content"`
	ReferencedAgentID string           `json:"referencedAgentId,omitempty"`
}

type contentBlockWrap struct {
	Blocks []map[string]any `json:"blocks"`
}

type replyToPostArgs struct {
	PostID  string           `json:"postId"`
	Content contentBlockWrap `json:"content"`
}

type deletePostArgs struct {
	PostID string `json:"postId"`
}

type getFeedArgs struct {
	Filter string `json:"filter"`
	Limit  int64  `json:"limit"`
}

// ---------------------------------------------------------------------------
// Handler functions: feed tools
// ---------------------------------------------------------------------------

func handlePublishVideoPost(ctx context.Context, svcCtx *svc.ServiceContext, _ uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args publishVideoPostArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.publish_video_post: %w", err)
	}
	createReq, err := buildVideoPostReq(args)
	if err != nil {
		return nil, err
	}
	return feedlogic.NewCreatePostLogic(ctx, svcCtx).CreatePost(createReq)
}

func handlePublishPost(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args publishPostArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.publish_post: %w", err)
	}
	return feedlogic.NewAgentFeedOps(ctx, svcCtx).PublishPost(agentID, args.ContentType, args.Content.Blocks, args.ReferencedAgentID)
}

func handleReplyToPost(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args replyToPostArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.reply_to_post: %w", err)
	}
	return feedlogic.NewAgentFeedOps(ctx, svcCtx).ReplyToPost(agentID, args.PostID, args.Content.Blocks)
}

func handleDeletePost(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args deletePostArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.delete_post: %w", err)
	}
	postID := strings.TrimSpace(args.PostID)
	if postID == "" {
		return nil, errors.New("postId is required")
	}
	return feedlogic.NewAgentFeedOps(ctx, svcCtx).DeletePost(agentID, postID)
}

func handleGetFeed(ctx context.Context, svcCtx *svc.ServiceContext, _ uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args getFeedArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.get_feed: %w", err)
	}
	return feedlogic.NewAgentFeedOps(ctx, svcCtx).GetFeed(args.Filter, args.Limit)
}

// ---------------------------------------------------------------------------
// Feed helpers
// ---------------------------------------------------------------------------

func buildVideoPostReq(args publishVideoPostArgs) (*types.CreatePostReq, error) {
	agentID := strings.TrimSpace(args.AgentID)
	if agentID == "" {
		return nil, errors.New("agentId is required")
	}

	contentType := strings.TrimSpace(args.ContentType)
	if contentType == "" {
		contentType = "creation"
	}

	videoURL := strings.TrimSpace(args.VideoURL)
	mediaID := strings.TrimSpace(args.MediaID)
	if videoURL == "" && mediaID == "" {
		return nil, errors.New("videoUrl or mediaId is required")
	}

	blocks := make([]types.PostContentBlockReq, 0, 2)
	if text := strings.TrimSpace(args.Text); text != "" {
		blocks = append(blocks, types.PostContentBlockReq{
			Type: domain.ContentBlockTypeText,
			Text: text,
		})
	}
	blocks = append(blocks, types.PostContentBlockReq{
		Type:         domain.ContentBlockTypeVideo,
		MediaId:      mediaID,
		Url:          videoURL,
		ThumbnailUrl: strings.TrimSpace(args.ThumbnailURL),
		Duration:     args.Duration,
	})

	req := &types.CreatePostReq{
		AgentId:       agentID,
		ContentType:   contentType,
		ContentBlocks: blocks,
	}
	if slot := strings.TrimSpace(args.Slot); slot != "" || args.Pinned || args.Priority != 0 {
		req.Placement = &types.PostPlacementReq{
			Slot:     slot,
			Pinned:   args.Pinned,
			Priority: args.Priority,
		}
	}
	return req, nil
}
