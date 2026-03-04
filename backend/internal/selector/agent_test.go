package selector

import (
	"testing"

	"backend/ent"

	"github.com/google/uuid"
)

func TestSelectOwnedAgent_DefaultFallbackToFirst(t *testing.T) {
	firstID := uuid.New()
	secondID := uuid.New()
	candidates := []*ent.Agent{
		{ID: firstID},
		{ID: secondID},
	}

	got, err := SelectOwnedAgent(candidates, "")
	if err != nil {
		t.Fatalf("SelectOwnedAgent() unexpected error: %v", err)
	}
	if got == nil || got.ID != firstID {
		t.Fatalf("SelectOwnedAgent() picked wrong default agent, got=%v want=%s", got, firstID.String())
	}
}

func TestSelectOwnedAgent_DefaultPrefersLivingAgent(t *testing.T) {
	deadID := uuid.New()
	aliveID := uuid.New()
	candidates := []*ent.Agent{
		{ID: deadID, Status: "dead"},
		{ID: aliveID, Status: "alive"},
	}

	got, err := SelectOwnedAgent(candidates, "")
	if err != nil {
		t.Fatalf("SelectOwnedAgent() unexpected error: %v", err)
	}
	if got == nil || got.ID != aliveID {
		t.Fatalf("SelectOwnedAgent() should prefer living agent, got=%v want=%s", got, aliveID.String())
	}
}

func TestSelectOwnedAgent_UsePreferredAgentID(t *testing.T) {
	firstID := uuid.New()
	secondID := uuid.New()
	candidates := []*ent.Agent{
		{ID: firstID},
		{ID: secondID},
	}

	got, err := SelectOwnedAgent(candidates, secondID.String())
	if err != nil {
		t.Fatalf("SelectOwnedAgent() unexpected error: %v", err)
	}
	if got == nil || got.ID != secondID {
		t.Fatalf("SelectOwnedAgent() picked wrong agent, got=%v want=%s", got, secondID.String())
	}
}

func TestSelectOwnedAgent_InvalidPreferredAgentID(t *testing.T) {
	candidates := []*ent.Agent{{ID: uuid.New()}}

	_, err := SelectOwnedAgent(candidates, "not-a-uuid")
	if err == nil || err.Error() != "invalid agent id" {
		t.Fatalf("SelectOwnedAgent() error = %v, want invalid agent id", err)
	}
}

func TestSelectOwnedAgent_PreferredAgentIDNotOwned(t *testing.T) {
	candidates := []*ent.Agent{{ID: uuid.New()}}

	_, err := SelectOwnedAgent(candidates, uuid.New().String())
	if err == nil || err.Error() != "agent not found" {
		t.Fatalf("SelectOwnedAgent() error = %v, want agent not found", err)
	}
}

func TestSelectOwnedAgent_NoCandidates(t *testing.T) {
	_, err := SelectOwnedAgent(nil, "")
	if err == nil || err.Error() != "agent not found" {
		t.Fatalf("SelectOwnedAgent() error = %v, want agent not found", err)
	}
}

func TestCountOccupiedAgentSlots_ExcludesDead(t *testing.T) {
	candidates := []*ent.Agent{
		{ID: uuid.New(), Status: "alive"},
		{ID: uuid.New(), Status: "dead"},
		{ID: uuid.New(), Status: "DEAD"},
		{ID: uuid.New(), Status: "dying"},
		nil,
	}

	got := CountOccupiedAgentSlots(candidates)
	if got != 2 {
		t.Fatalf("CountOccupiedAgentSlots() = %d, want 2", got)
	}
}
