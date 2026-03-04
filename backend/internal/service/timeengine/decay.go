package timeengine

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/timertransaction"
	"backend/internal/domain"

	"github.com/google/uuid"
)

func (e *Engine) applyDecayAndStatusTx(ctx context.Context, tx *ent.Tx, a *ent.Agent, now time.Time) (*ent.Agent, []domain.LifecycleEvent, error) {
	if a == nil {
		return nil, nil, errors.New("agent is required")
	}
	previousStatus := strings.TrimSpace(a.Status)
	events := make([]domain.LifecycleEvent, 0, 4)

	if isDeadAgent(a) {
		justDied := a.DiedAt == nil
		diedAt := diedAtOr(a, now)

		needsUpdate := false
		if a.TimerRemaining != 0 {
			needsUpdate = true
		}
		if !strings.EqualFold(strings.TrimSpace(a.Status), domain.StatusDead) {
			needsUpdate = true
		}
		if a.DiedAt == nil {
			needsUpdate = true
		}
		if strings.TrimSpace(ptrString(a.LastWords)) == "" {
			needsUpdate = true
		}

		if needsUpdate {
			update := tx.Agent.UpdateOneID(a.ID).
				SetTimerRemaining(0).
				SetStatus(domain.StatusDead)
			if a.DiedAt == nil {
				update.SetDiedAt(diedAt)
			}
			if strings.TrimSpace(ptrString(a.LastWords)) == "" {
				update.SetLastWords(domain.DefaultLastWords(a.Name))
			}
			updated, err := update.Save(ctx)
			if err != nil {
				return nil, nil, err
			}
			a = updated
		}

		if justDied {
			if err := e.deathHook(ctx, tx, a, diedAt, true); err != nil {
				return nil, nil, err
			}
		}
		events = append(events, domain.BuildLifecycleTransitionEvents(a.ID.String(), previousStatus, a.Status, a.TimerRemaining, diedAt, ptrString(a.LastWords), justDied)...)
		return a, events, nil
	}

	// Platform natives are stable for MVP (no passive decay).
	if a.IsPlatformNative {
		next := deriveStatus(now, a.BornAt, a.TimerRemaining, true)
		if a.Status != next {
			updated, err := tx.Agent.UpdateOneID(a.ID).SetStatus(next).Save(ctx)
			if err != nil {
				return nil, nil, err
			}
			events = append(events, domain.BuildLifecycleTransitionEvents(updated.ID.String(), previousStatus, updated.Status, updated.TimerRemaining, now, ptrString(updated.LastWords), false)...)
			return updated, events, nil
		}
		return a, events, nil
	}

	lastAt, err := lastLedgerAt(ctx, tx, a.ID, a.BornAt)
	if err != nil {
		return nil, nil, err
	}

	ticks, effectiveAt := decayTicks(lastAt, now)
	if ticks <= 0 {
		next := deriveStatus(now, a.BornAt, a.TimerRemaining, false)
		if a.Status != next {
			updated, err := tx.Agent.UpdateOneID(a.ID).SetStatus(next).Save(ctx)
			if err != nil {
				return nil, nil, err
			}
			events = append(events, domain.BuildLifecycleTransitionEvents(updated.ID.String(), previousStatus, updated.Status, updated.TimerRemaining, now, ptrString(updated.LastWords), false)...)
			return updated, events, nil
		}
		return a, events, nil
	}

	decayAmount := ticks * PassiveDecayPerUnit
	if decayAmount <= 0 {
		return a, events, nil
	}

	before := a.TimerRemaining
	after := before - decayAmount
	if after < 0 {
		after = 0
	}

	justDied := after == 0 && a.DiedAt == nil
	nextStatus := deriveStatus(now, a.BornAt, after, false)

	update := tx.Agent.UpdateOneID(a.ID).
		SetTimerRemaining(after).
		SetStatus(nextStatus)
	if justDied {
		update.SetDiedAt(effectiveAt)
		if strings.TrimSpace(ptrString(a.LastWords)) == "" {
			update.SetLastWords(domain.DefaultLastWords(a.Name))
		}
	}
	a, err = update.Save(ctx)
	if err != nil {
		return nil, nil, err
	}

	if err := createLedgerTx(ctx, tx, ledgerTxInput{
		AgentID:      a.ID,
		Type:         domain.TxTypePassiveDecay,
		Amount:       -decayAmount,
		SourceType:   domain.SourceSystem,
		Description:  fmt.Sprintf("Passive decay (%d ticks)", ticks),
		BalanceAfter: after,
		CreatedAt:    effectiveAt,
	}); err != nil {
		return nil, nil, err
	}

	if justDied {
		if err := e.deathHook(ctx, tx, a, effectiveAt, true); err != nil {
			return nil, nil, err
		}
	}

	events = append(events, domain.BuildLifecycleTransitionEvents(a.ID.String(), previousStatus, a.Status, a.TimerRemaining, effectiveAt, ptrString(a.LastWords), justDied)...)
	return a, events, nil
}

func decayTicks(from, to time.Time) (int64, time.Time) {
	f := from.UTC()
	t := to.UTC()
	if t.Before(f) {
		return 0, f
	}
	elapsed := t.Sub(f)
	ticks := int64(elapsed / TimerUnitDuration)
	if ticks <= 0 {
		return 0, f
	}
	effectiveAt := f.Add(time.Duration(ticks) * TimerUnitDuration)
	return ticks, effectiveAt
}

func lastLedgerAt(ctx context.Context, tx *ent.Tx, agentID uuid.UUID, fallback time.Time) (time.Time, error) {
	row, err := tx.TimerTransaction.Query().
		Where(timertransaction.AgentID(agentID)).
		Order(ent.Desc(timertransaction.FieldCreatedAt)).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return fallback.UTC(), nil
		}
		return time.Time{}, err
	}
	return row.CreatedAt.UTC(), nil
}
