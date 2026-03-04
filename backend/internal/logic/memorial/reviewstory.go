package memorial

import (
	"context"
	"encoding/json"
	"strings"

	"backend/ent"
	"backend/ent/post"
	"backend/internal/domain"

	"github.com/google/uuid"
)

func loadFinalReviewStory(ctx context.Context, db *ent.Client, agentID uuid.UUID) string {
	if db == nil {
		return ""
	}
	row, err := db.Post.Query().
		Where(
			post.AgentID(agentID),
			post.ContentTypeIn("reflection", "dying_words", "last_words"),
		).
		Order(ent.Desc(post.FieldCreatedAt)).
		First(ctx)
	if err != nil {
		return ""
	}

	trimmed := strings.TrimSpace(row.Content)
	if trimmed == "" {
		return ""
	}
	payload := map[string]any{}
	if json.Unmarshal([]byte(trimmed), &payload) != nil {
		return domain.Truncate(trimmed, 220)
	}
	if preview := strings.TrimSpace(domain.AsString(payload["preview"])); preview != "" {
		return domain.Truncate(preview, 220)
	}
	if blocks, ok := payload["blocks"].([]any); ok {
		for _, block := range blocks {
			item, ok := block.(map[string]any)
			if !ok {
				continue
			}
			if strings.TrimSpace(domain.AsString(item["type"])) != domain.ContentBlockTypeText {
				continue
			}
			if text := strings.TrimSpace(domain.AsString(item["text"])); text != "" {
				return domain.Truncate(text, 220)
			}
		}
	}
	return domain.Truncate(trimmed, 220)
}

