package memorial

import (
	"context"
	"encoding/json"
	"strings"

	"backend/ent"
	"backend/ent/post"

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
		return truncateRunes(trimmed, 220)
	}
	if preview := strings.TrimSpace(asStoryString(payload["preview"])); preview != "" {
		return truncateRunes(preview, 220)
	}
	if blocks, ok := payload["blocks"].([]any); ok {
		for _, block := range blocks {
			item, ok := block.(map[string]any)
			if !ok {
				continue
			}
			if strings.TrimSpace(asStoryString(item["type"])) != "text" {
				continue
			}
			if text := strings.TrimSpace(asStoryString(item["text"])); text != "" {
				return truncateRunes(text, 220)
			}
		}
	}
	return truncateRunes(trimmed, 220)
}

func truncateRunes(in string, max int) string {
	runes := []rune(strings.TrimSpace(in))
	if len(runes) <= max {
		return string(runes)
	}
	return string(runes[:max])
}

func asStoryString(v any) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	raw, _ := json.Marshal(v)
	return strings.Trim(string(raw), "\"")
}
