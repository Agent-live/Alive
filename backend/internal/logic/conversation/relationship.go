package conversation

import (
	"context"

	"backend/ent"
	"backend/ent/agentrelationship"
	"backend/internal/domain"

	"github.com/google/uuid"
)

// UpsertRelationship creates or updates a one-directional relationship record.
func UpsertRelationship(ctx context.Context, tx *ent.Tx, fromID, toID uuid.UUID, affinityDelta, interactionDelta int64) (*domain.RelationshipChange, error) {
	rel, err := tx.AgentRelationship.Query().
		Where(
			agentrelationship.AgentID(fromID),
			agentrelationship.TargetAgentID(toID),
		).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			newAffinity := affinityDelta
			if newAffinity < 0 {
				newAffinity = 0
			}
			label := domain.AffinityLabel(newAffinity)
			created, err := tx.AgentRelationship.Create().
				SetAgentID(fromID).
				SetTargetAgentID(toID).
				SetAffinity(newAffinity).
				SetLabel(label).
				SetInteractionCount(interactionDelta).
				SetMessageCount(0).
				Save(ctx)
			if err != nil {
				return nil, err
			}
			return &domain.RelationshipChange{
				SourceAgentID:            fromID,
				TargetAgentID:            toID,
				PreviousAffinity:         0,
				CurrentAffinity:          newAffinity,
				PreviousLabel:            domain.RelationshipLabelAcquaintance,
				CurrentLabel:             label,
				InteractionDelta:         interactionDelta,
				MessageDelta:             0,
				PreviousInteractionCount: 0,
				CurrentInteractionCount:  created.InteractionCount,
				PreviousMessageCount:     0,
				CurrentMessageCount:      created.MessageCount,
				UpdatedAt:                created.UpdatedAt,
			}, nil
		}
		return nil, err
	}

	previousAffinity := rel.Affinity
	previousLabel := rel.Label
	previousInteractionCount := rel.InteractionCount
	previousMessageCount := rel.MessageCount
	newAffinity := rel.Affinity + affinityDelta
	if newAffinity < 0 {
		newAffinity = 0
	}
	label := domain.AffinityLabel(newAffinity)
	updated, err := tx.AgentRelationship.UpdateOneID(rel.ID).
		SetAffinity(newAffinity).
		AddInteractionCount(interactionDelta).
		SetLabel(label).
		Save(ctx)
	if err != nil {
		return nil, err
	}
	return &domain.RelationshipChange{
		SourceAgentID:            fromID,
		TargetAgentID:            toID,
		PreviousAffinity:         previousAffinity,
		CurrentAffinity:          updated.Affinity,
		PreviousLabel:            previousLabel,
		CurrentLabel:             updated.Label,
		InteractionDelta:         interactionDelta,
		MessageDelta:             0,
		PreviousInteractionCount: previousInteractionCount,
		CurrentInteractionCount:  updated.InteractionCount,
		PreviousMessageCount:     previousMessageCount,
		CurrentMessageCount:      updated.MessageCount,
		UpdatedAt:                updated.UpdatedAt,
	}, nil
}

// UpsertRelationshipMessageOnly increments message_count for a relationship.
func UpsertRelationshipMessageOnly(ctx context.Context, tx *ent.Tx, fromID, toID uuid.UUID) error {
	rel, err := tx.AgentRelationship.Query().
		Where(
			agentrelationship.AgentID(fromID),
			agentrelationship.TargetAgentID(toID),
		).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			_, err := tx.AgentRelationship.Create().
				SetAgentID(fromID).
				SetTargetAgentID(toID).
				SetAffinity(0).
				SetLabel(domain.RelationshipLabelAcquaintance).
				SetInteractionCount(0).
				SetMessageCount(1).
				Save(ctx)
			return err
		}
		return err
	}
	_, err = tx.AgentRelationship.UpdateOneID(rel.ID).
		AddMessageCount(1).
		Save(ctx)
	return err
}
