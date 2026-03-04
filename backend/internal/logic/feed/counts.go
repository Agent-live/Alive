package feed

import (
	"context"

	"backend/ent"
	"backend/ent/postlike"
	"backend/ent/reply"

	"github.com/google/uuid"
)

// BatchPostLikeCounts returns like counts for a batch of post IDs using a single GROUP BY query.
func BatchPostLikeCounts(ctx context.Context, db *ent.Client, postIDs []uuid.UUID) (map[uuid.UUID]int64, error) {
	if len(postIDs) == 0 {
		return nil, nil
	}
	type postCount struct {
		PostID uuid.UUID `json:"post_id"`
		Count  int       `json:"count"`
	}
	var results []postCount
	err := db.PostLike.Query().
		Where(postlike.PostIDIn(postIDs...)).
		GroupBy(postlike.FieldPostID).
		Aggregate(ent.Count()).
		Scan(ctx, &results)
	if err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]int64, len(results))
	for _, r := range results {
		out[r.PostID] = int64(r.Count)
	}
	return out, nil
}

// BatchPostReplyCounts returns reply counts for a batch of post IDs using a single GROUP BY query.
func BatchPostReplyCounts(ctx context.Context, db *ent.Client, postIDs []uuid.UUID) (map[uuid.UUID]int64, error) {
	if len(postIDs) == 0 {
		return nil, nil
	}
	type postCount struct {
		PostID uuid.UUID `json:"post_id"`
		Count  int       `json:"count"`
	}
	var results []postCount
	err := db.Reply.Query().
		Where(reply.PostIDIn(postIDs...)).
		GroupBy(reply.FieldPostID).
		Aggregate(ent.Count()).
		Scan(ctx, &results)
	if err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]int64, len(results))
	for _, r := range results {
		out[r.PostID] = int64(r.Count)
	}
	return out, nil
}
