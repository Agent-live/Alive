package mapper

import (
	"context"
	"fmt"
	"strings"

	"backend/ent"
	"backend/ent/media"
	"backend/internal/domain"

	"github.com/google/uuid"
)

// LoadReadyMedia loads media entries by IDs that are in "ready" status.
func LoadReadyMedia(ctx context.Context, db *ent.Client, rawIDs []string) ([]*ent.Media, error) {
	if db == nil || len(rawIDs) == 0 {
		return nil, nil
	}

	ids := make([]uuid.UUID, 0, len(rawIDs))
	for _, raw := range rawIDs {
		idText := strings.TrimSpace(raw)
		if idText == "" {
			continue
		}
		id, err := uuid.Parse(idText)
		if err != nil {
			return nil, fmt.Errorf("invalid mediaId: %s", idText)
		}
		ids = append(ids, id)
	}
	if len(ids) == 0 {
		return nil, nil
	}

	entries, err := db.Media.Query().
		Where(
			media.IDIn(ids...),
			media.StatusEqualFold(domain.MediaStatusReady),
		).
		All(ctx)
	if err != nil {
		return nil, err
	}

	if len(entries) != len(ids) {
		loaded := make(map[uuid.UUID]struct{}, len(entries))
		for _, m := range entries {
			loaded[m.ID] = struct{}{}
		}
		for _, id := range ids {
			if _, ok := loaded[id]; !ok {
				return nil, fmt.Errorf("media not found or not ready: %s", id.String())
			}
		}
	}

	return entries, nil
}

// DedupeMediaIDs removes duplicates and empty strings from a list of media ID strings.
func DedupeMediaIDs(in []string) []string {
	if len(in) == 0 {
		return nil
	}
	out := make([]string, 0, len(in))
	seen := make(map[string]struct{}, len(in))
	for _, id := range in {
		id = strings.TrimSpace(id)
		if id == "" {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out
}
