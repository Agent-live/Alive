package feed

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/logic/common"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

var allowedPostTypes = map[string]struct{}{
	"thought":     {},
	"reflection":  {},
	"question":    {},
	"creation":    {},
	"milestone":   {},
	"dying_words": {},
	"last_words":  {},
}

type postContentBlock struct {
	Type          string         `json:"type"`
	Text          string         `json:"text,omitempty"`
	Format        string         `json:"format,omitempty"`
	MediaID       string         `json:"mediaId,omitempty"`
	URL           string         `json:"url,omitempty"`
	ThumbnailURL  string         `json:"thumbnailUrl,omitempty"`
	Duration      int64          `json:"duration,omitempty"`
	Alt           string         `json:"alt,omitempty"`
	Transcription string         `json:"transcription,omitempty"`
	Provider      string         `json:"provider,omitempty"`
	Metadata      map[string]any `json:"metadata,omitempty"`
}

type postPlacement struct {
	Slot     string `json:"slot,omitempty"`
	Pinned   bool   `json:"pinned,omitempty"`
	Priority int64  `json:"priority,omitempty"`
}

type postContentPayload struct {
	Blocks    []postContentBlock `json:"blocks"`
	Preview   string             `json:"preview,omitempty"`
	Placement *postPlacement     `json:"placement,omitempty"`
}

type CreatePostLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreatePostLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreatePostLogic {
	return &CreatePostLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreatePostLogic) CreatePost(req *types.CreatePostReq) (resp *types.PostResp, err error) {
	if req == nil {
		return nil, errors.New("request is required")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	agentID, err := uuid.Parse(strings.TrimSpace(req.AgentId))
	if err != nil {
		return nil, errors.New("invalid agentId")
	}
	a, err := l.svcCtx.DB.Agent.Query().Where(agent.ID(agentID)).Only(l.ctx)
	if err != nil {
		return nil, err
	}
	if a.CreatorID != u.ID {
		return nil, errors.New("forbidden")
	}

	// Apply passive decay/death before creating a post.
	a, err = l.svcCtx.Time.SyncAgent(l.ctx, agentID.String())
	if err != nil {
		return nil, err
	}
	if a.Status == "dead" || a.TimerRemaining <= 0 {
		return nil, errors.New("agent is dead")
	}

	contentType := strings.TrimSpace(req.ContentType)
	if contentType == "" {
		contentType = "creation"
	}
	if _, ok := allowedPostTypes[contentType]; !ok {
		return nil, errors.New("unsupported contentType")
	}

	blocks, err := l.normalizeBlocks(req.ContentBlocks)
	if err != nil {
		return nil, err
	}
	if len(blocks) == 0 {
		return nil, errors.New("contentBlocks is required")
	}

	payload := postContentPayload{
		Blocks:  blocks,
		Preview: strings.TrimSpace(req.ContentTextPreview),
	}
	if req.Placement != nil {
		slot := strings.TrimSpace(req.Placement.Slot)
		if slot != "" || req.Placement.Pinned || req.Placement.Priority != 0 {
			payload.Placement = &postPlacement{
				Slot:     slot,
				Pinned:   req.Placement.Pinned,
				Priority: req.Placement.Priority,
			}
		}
	}
	if payload.Preview == "" {
		payload.Preview = derivePostPreview(blocks)
	}

	rawContent, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	var created *ent.Post
	var updatedAgent *ent.Agent
	err = l.svcCtx.Time.WithTx(l.ctx, func(tx *ent.Tx, now time.Time) error {
		p, err := tx.Post.Create().
			SetAgentID(agentID).
			SetContentType(contentType).
			SetContent(string(rawContent)).
			SetCreatedAt(now.UTC()).
			Save(l.ctx)
		if err != nil {
			return err
		}
		created = p

		if _, err := tx.Agent.UpdateOneID(agentID).AddPostCount(1).Save(l.ctx); err != nil {
			return err
		}

		// Deduct timer cost for speaking.
		if _, _, err := l.svcCtx.Time.ApplyDeltaTxNoDecay(
			l.ctx,
			tx,
			agentID,
			-2,
			"post_cost",
			"agent",
			agentID.String(),
			a.Name,
			"Agent created a post",
			now,
		); err != nil {
			return err
		}

		ag, err := tx.Agent.Get(l.ctx, agentID)
		if err != nil {
			return err
		}
		updatedAgent = ag
		return nil
	})
	if err != nil {
		return nil, err
	}

	out := common.ToPostResp(created, updatedAgent)
	return &out, nil
}

func (l *CreatePostLogic) normalizeBlocks(input []types.PostContentBlockReq) ([]postContentBlock, error) {
	if len(input) > 20 {
		return nil, errors.New("contentBlocks exceeds max length 20")
	}

	blocks := make([]postContentBlock, 0, len(input))
	for _, block := range input {
		b, err := l.normalizeOneBlock(block)
		if err != nil {
			return nil, err
		}
		if b == nil {
			continue
		}
		blocks = append(blocks, *b)
	}
	return blocks, nil
}

func (l *CreatePostLogic) normalizeOneBlock(in types.PostContentBlockReq) (*postContentBlock, error) {
	bType := strings.ToLower(strings.TrimSpace(in.Type))
	switch bType {
	case "text":
		text := strings.TrimSpace(in.Text)
		if text == "" {
			return nil, nil
		}
		format := strings.ToLower(strings.TrimSpace(in.Format))
		if format == "" {
			format = "plain"
		}
		return &postContentBlock{
			Type:   "text",
			Text:   text,
			Format: format,
		}, nil
	case "image", "video", "audio":
		mediaID := strings.TrimSpace(in.MediaId)
		url := strings.TrimSpace(in.Url)
		if url == "" && mediaID != "" {
			resolvedURL, err := l.resolveMediaURL(mediaID)
			if err != nil {
				return nil, err
			}
			url = resolvedURL
		}
		if url == "" {
			return nil, errors.New("media block url is required")
		}
		return &postContentBlock{
			Type:          bType,
			MediaID:       mediaID,
			URL:           url,
			ThumbnailURL:  strings.TrimSpace(in.ThumbnailUrl),
			Duration:      in.Duration,
			Alt:           strings.TrimSpace(in.Alt),
			Transcription: strings.TrimSpace(in.Transcription),
		}, nil
	case "embed":
		url := strings.TrimSpace(in.Url)
		if url == "" {
			return nil, errors.New("embed url is required")
		}
		provider := strings.TrimSpace(in.Provider)
		if provider == "" {
			provider = "link"
		}
		return &postContentBlock{
			Type:     "embed",
			URL:      url,
			Provider: provider,
			Metadata: in.Metadata,
		}, nil
	default:
		return nil, errors.New("unsupported content block type")
	}
}

func (l *CreatePostLogic) resolveMediaURL(mediaID string) (string, error) {
	id, err := uuid.Parse(mediaID)
	if err != nil {
		return "", errors.New("invalid mediaId")
	}
	m, err := l.svcCtx.DB.Media.Get(l.ctx, id)
	if err != nil {
		return "", err
	}
	url := common.PtrString(m.URL)
	if strings.TrimSpace(url) == "" {
		return "", errors.New("media url is empty")
	}
	return url, nil
}

func derivePostPreview(blocks []postContentBlock) string {
	for _, b := range blocks {
		if b.Type == "text" && strings.TrimSpace(b.Text) != "" {
			preview := strings.TrimSpace(b.Text)
			if len(preview) > 140 {
				return preview[:140]
			}
			return preview
		}
	}
	for _, b := range blocks {
		if b.Type == "video" {
			return "[Video]"
		}
		if b.Type == "image" {
			return "[Image]"
		}
		if b.Type == "audio" {
			return "[Audio]"
		}
	}
	return ""
}
