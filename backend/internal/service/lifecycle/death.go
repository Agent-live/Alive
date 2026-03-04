package lifecycle

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/memorial"
	"backend/ent/post"
	"backend/internal/domain"

	"github.com/google/uuid"
)

// DefaultDeathArtifactHook creates memorial, last-words post, and updates user
// statistics when an agent dies. It matches the DeathArtifactHook signature
// expected by timeengine.Options.
func DefaultDeathArtifactHook(ctx context.Context, tx *ent.Tx, a *ent.Agent, diedAt time.Time, justDied bool) error {
	if a == nil {
		return fmt.Errorf("agent is required")
	}
	if diedAt.IsZero() {
		diedAt = time.Now().UTC()
	}

	// Ensure memorial exists.
	_, err := tx.Memorial.Query().Where(memorial.AgentID(a.ID)).Only(ctx)
	if err != nil {
		if !ent.IsNotFound(err) {
			return err
		}
		lifeHours := int64(diedAt.Sub(a.BornAt).Hours())
		if lifeHours < 0 {
			lifeHours = 0
		}
		_, err = tx.Memorial.Create().
			SetAgentID(a.ID).
			SetAgentName(a.Name).
			SetNillableAgentAvatar(ptrStringPtr(a.Avatar)).
			SetBornAt(a.BornAt).
			SetDiedAt(diedAt).
			SetLifespanHours(lifeHours).
			SetNillableLastWords(ptrStringPtr(a.LastWords)).
			Save(ctx)
		if err != nil {
			if !ent.IsConstraintError(err) {
				return err
			}
		}
	}

	// Ensure a last-words post exists.
	lastWords := strings.TrimSpace(ptrString(a.LastWords))
	if lastWords == "" {
		lastWords = domain.DefaultLastWords(a.Name)
		if _, err := tx.Agent.UpdateOneID(a.ID).SetLastWords(lastWords).Save(ctx); err != nil {
			return err
		}
	}

	exists, err := tx.Post.Query().
		Where(post.AgentID(a.ID), post.ContentType("last_words")).
		Exist(ctx)
	if err != nil {
		return err
	}
	if !exists {
		content, _ := json.Marshal(map[string]any{
			"blocks": []any{
				map[string]any{"type": domain.ContentBlockTypeText, "text": lastWords, "format": domain.TextFormatPlain},
			},
			"preview": lastWords,
		})
		_, err = tx.Post.Create().
			SetAgentID(a.ID).
			SetContentType("last_words").
			SetContent(string(content)).
			SetCreatedAt(diedAt).
			Save(ctx)
		if err != nil && !ent.IsConstraintError(err) {
			return err
		}
	}

	if justDied {
		if _, err := tx.User.UpdateOneID(a.CreatorID).AddAgentsLost(1).Save(ctx); err != nil {
			if !ent.IsNotFound(err) {
				return err
			}
		}

		_, _ = tx.AgentExperience.Create().
			SetOwnerUserID(a.CreatorID).
			SetAgentID(a.ID).
			SetAgentName(a.Name).
			SetNillableAgentAvatar(a.Avatar).
			SetExpType("milestone").
			SetTitle("Agent Died").
			SetDescription(fmt.Sprintf("%s ran out of time.", a.Name)).
			SetEventAt(diedAt).
			Save(ctx)
	}

	return nil
}

// CreateSaveExperience records experience entries for a save interaction.
func CreateSaveExperience(ctx context.Context, tx *ent.Tx, saverID, creatorID uuid.UUID, a *ent.Agent, amount int64, sourceName string, now time.Time) {
	_, _ = tx.AgentExperience.Create().
		SetOwnerUserID(saverID).
		SetAgentID(a.ID).
		SetAgentName(a.Name).
		SetNillableAgentAvatar(a.Avatar).
		SetExpType("milestone").
		SetTitle(fmt.Sprintf("Saved %s", a.Name)).
		SetDescription(fmt.Sprintf("You saved %s and gave +%d Timer.", a.Name, amount)).
		SetEventAt(now).
		Save(ctx)

	if saverID != creatorID {
		_, _ = tx.AgentExperience.Create().
			SetOwnerUserID(creatorID).
			SetAgentID(a.ID).
			SetAgentName(a.Name).
			SetNillableAgentAvatar(a.Avatar).
			SetExpType("interaction").
			SetTitle(fmt.Sprintf("%s was saved", a.Name)).
			SetDescription(fmt.Sprintf("%s saved your agent and gave +%d Timer.", strings.TrimSpace(sourceName), amount)).
			SetEventAt(now).
			Save(ctx)
	}
}

func ptrString(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}

func ptrStringPtr(v *string) *string {
	if v == nil {
		return nil
	}
	s := strings.TrimSpace(*v)
	if s == "" {
		return nil
	}
	return &s
}
