package timeengine

import (
	"context"
	"errors"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/timertransaction"
	"backend/internal/domain"
	"backend/internal/service/lifecycle"

	"github.com/google/uuid"
)

// ApplyDeltaTxNoDecay applies a timer delta inside an existing transaction.
func (e *Engine) ApplyDeltaTxNoDecay(ctx context.Context, tx *ent.Tx, agentID uuid.UUID, amount int64, txType, sourceType, sourceID, sourceName, description string, now time.Time) (*ent.Agent, bool, error) {
	if tx == nil {
		return nil, false, errors.New("tx is required")
	}
	var (
		out      *ent.Agent
		justDied bool
	)
	err := e.withAgentLock(agentID, func() error {
		a, getErr := tx.Agent.Get(ctx, agentID)
		if getErr != nil {
			return getErr
		}
		var applyErr error
		out, justDied, applyErr = e.applyDeltaNoDecayTx(ctx, tx, a, amount, txType, sourceType, sourceID, sourceName, description, now)
		return applyErr
	})
	if err != nil {
		return nil, false, err
	}
	return out, justDied, nil
}

func (e *Engine) applyDeltaNoDecayTx(ctx context.Context, tx *ent.Tx, a *ent.Agent, amount int64, txType, sourceType, sourceID, sourceName, description string, now time.Time) (*ent.Agent, bool, error) {
	if a == nil {
		return nil, false, errors.New("agent is required")
	}
	if isDeadAgent(a) {
		return nil, false, businessErr("agent is dead")
	}

	if amount > 0 && strings.EqualFold(sourceType, domain.SourceHuman) && sourceID != "" && txType != domain.TxTypeLoginBonus {
		if uid, uErr := parseUUID(sourceID); uErr == nil && uid == a.CreatorID {
			return nil, false, businessErr("cannot give timer to your own agent")
		}
	}

	if amount > 0 && strings.EqualFold(strings.TrimSpace(txType), domain.TxTypeLoginBonus) && strings.EqualFold(sourceType, domain.SourceHuman) && sourceID != "" {
		start := startOfDayUTC(now)
		exists, err := tx.TimerTransaction.Query().
			Where(
				timertransaction.TxType(domain.TxTypeLoginBonus),
				timertransaction.SourceType(domain.SourceHuman),
				timertransaction.SourceID(sourceID),
				timertransaction.CreatedAtGTE(start),
			).
			Exist(ctx)
		if err != nil {
			return nil, false, err
		}
		if exists {
			return nil, false, businessErr("login bonus already claimed")
		}
	}

	if strings.EqualFold(sourceType, "human") && sourceID != "" {
		if err := e.enforceDailyBudgetTx(ctx, tx, sourceID, txType, amount, now); err != nil {
			return nil, false, err
		}
	}

	before := a.TimerRemaining
	after := before + amount
	if after < 0 {
		after = 0
	}

	justDied := after == 0 && a.DiedAt == nil
	nextStatus := deriveStatus(now, a.BornAt, after, a.IsPlatformNative)
	countsInteraction := amount > 0 && countsAsInteraction(txType)

	update := tx.Agent.UpdateOneID(a.ID).
		SetTimerRemaining(after).
		SetStatus(nextStatus)
	if amount > 0 {
		update.SetTotalTimerReceived(a.TotalTimerReceived + amount)
	}
	if countsInteraction {
		update.AddInteractionCount(1)
	}
	if justDied {
		update.SetDiedAt(now)
		if strings.TrimSpace(ptrString(a.LastWords)) == "" {
			update.SetLastWords(domain.DefaultLastWords(a.Name))
		}
	}
	a, err := update.Save(ctx)
	if err != nil {
		return nil, false, err
	}

	if err := createLedgerTx(ctx, tx, ledgerTxInput{
		AgentID:      a.ID,
		Type:         strings.TrimSpace(txType),
		Amount:       amount,
		SourceType:   strings.TrimSpace(sourceType),
		SourceID:     strings.TrimSpace(sourceID),
		SourceName:   strings.TrimSpace(sourceName),
		Description:  strings.TrimSpace(description),
		BalanceAfter: after,
		CreatedAt:    now,
	}); err != nil {
		return nil, false, err
	}

	if strings.EqualFold(sourceType, "human") && sourceID != "" && countsTowardsBudget(txType) && amount > 0 {
		uid, uErr := parseUUID(sourceID)
		if uErr == nil {
			userUpdate := tx.User.UpdateOneID(uid).AddTotalTimerGiven(amount)
			if txType == "save" {
				userUpdate.AddAgentsSaved(1)
			}
			if _, err := userUpdate.Save(ctx); err != nil {
				return nil, false, err
			}
		}
	}

	if strings.EqualFold(strings.TrimSpace(txType), "save") && amount > 0 && strings.EqualFold(sourceType, "human") && sourceID != "" {
		if saverID, uErr := parseUUID(sourceID); uErr == nil {
			lifecycle.CreateSaveExperience(ctx, tx, saverID, a.CreatorID, a, amount, sourceName, now)
		}
	}

	if justDied {
		if err := e.deathHook(ctx, tx, a, now, true); err != nil {
			return nil, false, err
		}
	}

	return a, justDied, nil
}

func (e *Engine) enforceDailyBudgetTx(ctx context.Context, tx *ent.Tx, sourceID, txType string, amount int64, now time.Time) error {
	if amount <= 0 {
		return nil
	}
	if !countsTowardsBudget(txType) {
		return nil
	}

	start := startOfDayUTC(now)
	rows, err := tx.TimerTransaction.Query().
		Where(
			timertransaction.SourceType("human"),
			timertransaction.SourceID(sourceID),
			timertransaction.CreatedAtGTE(start),
			timertransaction.TxTypeIn("like", "reply", "share", "save", "gift"),
		).
		All(ctx)
	if err != nil {
		return err
	}

	used := int64(0)
	likes := int64(0)
	replies := int64(0)
	shares := int64(0)
	saves := int64(0)
	for _, row := range rows {
		if row.Amount > 0 {
			used += row.Amount
		}
		switch row.TxType {
		case "like":
			likes++
		case "reply":
			replies++
		case "share":
			shares++
		case "save":
			saves++
		}
	}

	if used+amount > DailyTimerBudget {
		return businessErr("daily timer budget exceeded")
	}

	switch txType {
	case "like":
		if likes >= DailyLikesMax {
			return businessErr("daily like limit reached")
		}
	case "reply":
		if replies >= DailyRepliesMax {
			return businessErr("daily reply limit reached")
		}
	case "share":
		if shares >= DailySharesMax {
			return businessErr("daily share limit reached")
		}
	case "save":
		if saves >= DailySavesMax {
			return businessErr("daily save limit reached")
		}
	}
	return nil
}

type ledgerTxInput struct {
	AgentID      uuid.UUID
	Type         string
	Amount       int64
	SourceType   string
	SourceID     string
	SourceName   string
	Description  string
	BalanceAfter int64
	CreatedAt    time.Time
}

func createLedgerTx(ctx context.Context, tx *ent.Tx, in ledgerTxInput) error {
	if strings.TrimSpace(in.Type) == "" {
		return errors.New("tx type is required")
	}
	if strings.TrimSpace(in.Description) == "" {
		in.Description = in.Type
	}
	create := tx.TimerTransaction.Create().
		SetTxType(in.Type).
		SetAmount(in.Amount).
		SetAgentID(in.AgentID).
		SetSourceType(defaultIfEmpty(in.SourceType, domain.SourceSystem)).
		SetDescription(in.Description).
		SetBalanceAfter(in.BalanceAfter).
		SetCreatedAt(in.CreatedAt.UTC())
	if in.SourceID != "" {
		create.SetSourceID(in.SourceID)
	}
	if in.SourceName != "" {
		create.SetSourceName(in.SourceName)
	}
	_, err := create.Save(ctx)
	return err
}

func countsTowardsBudget(txType string) bool {
	switch strings.TrimSpace(txType) {
	case "like", "reply", "share", "save", "gift":
		return true
	default:
		return false
	}
}

func countsAsInteraction(txType string) bool {
	switch strings.TrimSpace(txType) {
	case "like", "reply", "share", "save", "gift":
		return true
	default:
		return false
	}
}

func startOfDayUTC(now time.Time) time.Time {
	t := now.UTC()
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}
