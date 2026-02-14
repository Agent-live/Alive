package feed

import (
	"testing"

	"backend/internal/types"
)

func TestPlacementMatches(t *testing.T) {
	tests := []struct {
		name      string
		placement *types.PostPlacementResp
		slot      string
		want      bool
	}{
		{
			name:      "empty slot nil placement",
			placement: nil,
			slot:      "",
			want:      false,
		},
		{
			name:      "empty slot any placement",
			placement: &types.PostPlacementResp{Slot: "feed.video"},
			slot:      "",
			want:      true,
		},
		{
			name:      "slot match ignore case",
			placement: &types.PostPlacementResp{Slot: "Feed.Video"},
			slot:      "feed.video",
			want:      true,
		},
		{
			name:      "slot mismatch",
			placement: &types.PostPlacementResp{Slot: "feed.main"},
			slot:      "feed.video",
			want:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := placementMatches(tt.placement, tt.slot)
			if got != tt.want {
				t.Fatalf("placementMatches() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestApplyFeedPlacement_OrderBySlotThenPinnedThenPriorityThenCreatedAt(t *testing.T) {
	base := []types.PostResp{
		{
			Id:        "A",
			CreatedAt: "2026-02-13T10:04:00Z",
		},
		{
			Id: "B",
			Placement: &types.PostPlacementResp{
				Slot:     "feed.video",
				Pinned:   false,
				Priority: 2,
			},
			CreatedAt: "2026-02-13T10:03:00Z",
		},
		{
			Id: "C",
			Placement: &types.PostPlacementResp{
				Slot:     "feed.main",
				Pinned:   true,
				Priority: 5,
			},
			CreatedAt: "2026-02-13T10:01:00Z",
		},
		{
			Id: "D",
			Placement: &types.PostPlacementResp{
				Slot:     "feed.video",
				Pinned:   true,
				Priority: 10,
			},
			CreatedAt: "2026-02-13T10:02:00Z",
		},
	}

	ordered := applyFeedPlacement(append([]types.PostResp(nil), base...), "")
	expectOrder(t, ordered, []string{"C", "D", "B", "A"})

	orderedBySlot := applyFeedPlacement(append([]types.PostResp(nil), base...), "feed.video")
	expectOrder(t, orderedBySlot, []string{"D", "B", "C", "A"})
}

func expectOrder(t *testing.T, posts []types.PostResp, want []string) {
	t.Helper()
	if len(posts) != len(want) {
		t.Fatalf("len(posts) = %d, want %d", len(posts), len(want))
	}
	for i := range want {
		if posts[i].Id != want[i] {
			t.Fatalf("order mismatch at index %d: got %s, want %s", i, posts[i].Id, want[i])
		}
	}
}
