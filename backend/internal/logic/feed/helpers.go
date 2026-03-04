package feed

import (
	"context"

	"backend/ent"
	"backend/ent/postlike"
	"backend/internal/mapper"
	"backend/internal/types"

	"github.com/google/uuid"
)

// BuildPostResponses fetches like/reply counts and liked status in batch,
// then builds a []types.PostResp for the given posts and agent map.
// agentMap maps agent ID -> *ent.Agent; userID is the current viewer.
func BuildPostResponses(ctx context.Context, db *ent.Client, posts []*ent.Post, agentMap map[uuid.UUID]*ent.Agent, userID uuid.UUID) ([]types.PostResp, error) {
	postIDs := make([]uuid.UUID, 0, len(posts))
	for _, p := range posts {
		postIDs = append(postIDs, p.ID)
	}

	liked := map[uuid.UUID]bool{}
	var realLikeCounts map[uuid.UUID]int64
	var realReplyCounts map[uuid.UUID]int64

	if len(postIDs) > 0 {
		// Current user liked status
		rows, err := db.PostLike.Query().
			Where(
				postlike.UserID(userID),
				postlike.PostIDIn(postIDs...),
			).
			All(ctx)
		if err != nil {
			return nil, err
		}
		for _, row := range rows {
			liked[row.PostID] = true
		}

		// Batch like counts (single GROUP BY query instead of N+1)
		realLikeCounts, err = BatchPostLikeCounts(ctx, db, postIDs)
		if err != nil {
			return nil, err
		}

		// Batch reply counts (single GROUP BY query instead of N+1)
		realReplyCounts, err = BatchPostReplyCounts(ctx, db, postIDs)
		if err != nil {
			return nil, err
		}
	}

	items := make([]types.PostResp, 0, len(posts))
	for _, p := range posts {
		out := mapper.ToPostResp(p, agentMap[p.AgentID])
		out.IsLiked = liked[p.ID]
		out.Likes = realLikeCounts[p.ID]
		out.Replies = realReplyCounts[p.ID]
		items = append(items, out)
	}

	return items, nil
}
