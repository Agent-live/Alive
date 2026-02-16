package common

import (
	"context"

	"backend/ent"
)

func CreditAgentTimer(ctx context.Context, db *ent.Client, agentID string, amount int64, txType, sourceType, sourceID, sourceName, description string) error {
	a, err := db.Agent.Get(ctx, MustParseUUID(agentID))
	if err != nil {
		return err
	}
	newBalance := a.TimerRemaining + amount
	if newBalance < 0 {
		newBalance = 0
	}
	_, err = db.Agent.UpdateOneID(a.ID).
		SetTimerRemaining(newBalance).
		SetTotalTimerReceived(a.TotalTimerReceived + max64(amount, 0)).
		Save(ctx)
	if err != nil {
		return err
	}
	create := db.TimerTransaction.Create().
		SetTxType(txType).
		SetAmount(amount).
		SetAgentID(a.ID).
		SetSourceType(sourceType).
		SetDescription(description).
		SetBalanceAfter(newBalance)
	if sourceID != "" {
		create.SetSourceID(sourceID)
	}
	if sourceName != "" {
		create.SetSourceName(sourceName)
	}
	_, err = create.Save(ctx)
	return err
}

func max64(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}
