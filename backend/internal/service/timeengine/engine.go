package timeengine

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/memorial"
	"backend/ent/post"
	"backend/ent/timertransaction"

	"github.com/google/uuid"
)

const (
	// TimerUnitDuration defines the real-time duration of 1 Timer unit.
	// Frontend displays 1 Timer as 10 minutes (600 seconds) via timerToLifeClock().
	TimerUnitDuration = 10 * time.Minute

	// InitialTimer is the default starting balance for a newly created agent.
	// 288 Timer = 48 hours at 10 minutes per Timer.
	InitialTimer int64 = 288

	// PassiveDecayPerUnit removes 1 Timer unit every TimerUnitDuration.
	// That yields 144 Timer/day (24h) and matches the "48h initial timer = 288 Timer" baseline.
	PassiveDecayPerUnit int64 = 1

	// DailyTimerBudget caps how much Timer a human can mint/give per day through actions (like/reply/share/save/gift).
	DailyTimerBudget int64 = 200

	DailyLikesMax   int64 = 50
	DailyRepliesMax int64 = 20
	DailySharesMax  int64 = 20
	DailySavesMax   int64 = 3
)

type Engine struct {
	db *ent.Client

	enabled   bool
	interval  time.Duration
	eventHook LifecycleEventHook

	mu                   sync.Mutex
	stop                 chan struct{}
	done                 chan struct{}
	lastAnniversarySweep string
}

type TxFunc func(tx *ent.Tx, now time.Time) error

// BusinessError represents a rule-level rejection (budget/limits/dead agent/etc).
// Callers may choose to commit decay/status updates even when returning this error.
type BusinessError struct {
	message string
}

func (e *BusinessError) Error() string {
	return e.message
}

func NewBusinessError(msg string) error {
	return &BusinessError{message: strings.TrimSpace(msg)}
}

func businessErr(msg string) error {
	return NewBusinessError(msg)
}

func isBusinessErr(err error) bool {
	var be *BusinessError
	return errors.As(err, &be)
}

type Options struct {
	Enabled   bool
	Interval  time.Duration
	EventHook LifecycleEventHook
}

type LifecycleEvent struct {
	Type       string
	AgentID    string
	OccurredAt time.Time
	DedupeKey  string
	Payload    map[string]any
}

type LifecycleEventHook func(ctx context.Context, event LifecycleEvent)

func New(db *ent.Client, opts Options) *Engine {
	interval := opts.Interval
	if interval <= 0 {
		interval = time.Minute
	}
	return &Engine{
		db:        db,
		enabled:   opts.Enabled,
		interval:  interval,
		eventHook: opts.EventHook,
	}
}

func (e *Engine) Start() {
	if !e.enabled || e.db == nil {
		return
	}
	e.mu.Lock()
	if e.stop != nil {
		e.mu.Unlock()
		return
	}
	e.stop = make(chan struct{})
	e.done = make(chan struct{})
	e.mu.Unlock()

	go func() {
		defer close(e.done)
		// One immediate tick on startup to catch up after downtime.
		_ = e.SyncAll(context.Background())
		ticker := time.NewTicker(e.interval)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				_ = e.SyncAll(context.Background())
			case <-e.stop:
				return
			}
		}
	}()
}

func (e *Engine) Stop() {
	e.mu.Lock()
	stop := e.stop
	done := e.done
	e.stop = nil
	e.done = nil
	e.mu.Unlock()

	if stop == nil {
		return
	}
	close(stop)
	<-done
}

func (e *Engine) emitLifecycleEvents(events []LifecycleEvent) {
	if e == nil || e.eventHook == nil || len(events) == 0 {
		return
	}
	for _, event := range events {
		evt := event
		go func() {
			defer func() {
				_ = recover()
			}()
			e.eventHook(context.Background(), evt)
		}()
	}
}

// WithTx runs fn inside a DB transaction while holding the engine mutex.
// Use it when you need to mutate multiple tables atomically alongside timer ledger updates.
func (e *Engine) WithTx(ctx context.Context, fn TxFunc) error {
	if e.db == nil {
		return errors.New("db is not available")
	}
	if fn == nil {
		return errors.New("fn is required")
	}

	now := time.Now().UTC()

	e.mu.Lock()
	defer e.mu.Unlock()

	tx, err := e.db.Tx(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if err := fn(tx, now); err != nil {
		return err
	}
	return tx.Commit()
}

// SyncAll applies passive decay + status transitions for all non-dead agents.
// It must be safe to call frequently.
func (e *Engine) SyncAll(ctx context.Context) error {
	if e.db == nil {
		return nil
	}

	now := time.Now().UTC()

	e.mu.Lock()
	defer e.mu.Unlock()

	agents, err := e.db.Agent.Query().
		Where(agent.StatusNotIn("dead")).
		All(ctx)
	if err != nil {
		return err
	}

	for _, a := range agents {
		if a == nil {
			continue
		}
		if _, err := e.syncAgentLocked(ctx, a.ID, now); err != nil {
			// Best-effort: keep ticking other agents even if one fails.
			_ = err
			continue
		}
	}

	if anniversaryEvents, annErr := e.collectMemorialAnniversaryEventsLocked(ctx, now); annErr == nil {
		e.emitLifecycleEvents(anniversaryEvents)
	}
	return nil
}

// SyncAgent updates one agent timer/status based on elapsed time since last ledger entry.
func (e *Engine) SyncAgent(ctx context.Context, agentID string) (*ent.Agent, error) {
	if e.db == nil {
		return nil, errors.New("db is not available")
	}
	id, err := parseUUID(agentID)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()

	e.mu.Lock()
	defer e.mu.Unlock()
	return e.syncAgentLocked(ctx, id, now)
}

// ApplyDelta credits (positive) or debits (negative) an agent timer balance, enforcing decay/death invariants.
func (e *Engine) ApplyDelta(ctx context.Context, agentID string, amount int64, txType, sourceType, sourceID, sourceName, description string) error {
	if e.db == nil {
		return errors.New("db is not available")
	}
	id, err := parseUUID(agentID)
	if err != nil {
		return err
	}

	now := time.Now().UTC()

	e.mu.Lock()
	defer e.mu.Unlock()

	tx, err := e.db.Tx(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	a, err := tx.Agent.Get(ctx, id)
	if err != nil {
		return err
	}
	a, lifecycleEvents, err := e.applyDecayAndStatusTx(ctx, tx, a, now)
	if err != nil {
		return err
	}
	if isDeadAgent(a) {
		if err := e.ensureDeathArtifactsTx(ctx, tx, a, diedAtOr(a, now), false); err != nil {
			return err
		}
		if err := tx.Commit(); err != nil {
			return err
		}
		e.emitLifecycleEvents(lifecycleEvents)
		return businessErr("agent is dead")
	}

	_, _, err = e.applyDeltaNoDecayTx(ctx, tx, a, amount, txType, sourceType, sourceID, sourceName, description, now)
	if err != nil {
		if isBusinessErr(err) {
			// Keep decay/status updates even when rejecting the requested delta.
			if cErr := tx.Commit(); cErr != nil {
				return cErr
			}
			e.emitLifecycleEvents(lifecycleEvents)
		}
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	e.emitLifecycleEvents(lifecycleEvents)
	return nil
}

func (e *Engine) syncAgentLocked(ctx context.Context, id uuid.UUID, now time.Time) (*ent.Agent, error) {
	tx, err := e.db.Tx(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	a, err := tx.Agent.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	a, lifecycleEvents, err := e.applyDecayAndStatusTx(ctx, tx, a, now)
	if err != nil {
		return nil, err
	}
	if isDeadAgent(a) {
		if err := e.ensureDeathArtifactsTx(ctx, tx, a, diedAtOr(a, now), false); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	e.emitLifecycleEvents(lifecycleEvents)
	return a, nil
}

func (e *Engine) applyDecayAndStatusTx(ctx context.Context, tx *ent.Tx, a *ent.Agent, now time.Time) (*ent.Agent, []LifecycleEvent, error) {
	if a == nil {
		return nil, nil, errors.New("agent is required")
	}
	previousStatus := strings.TrimSpace(a.Status)
	events := make([]LifecycleEvent, 0, 4)

	if isDeadAgent(a) {
		justDied := a.DiedAt == nil
		diedAt := diedAtOr(a, now)

		needsUpdate := false
		if a.TimerRemaining != 0 {
			needsUpdate = true
		}
		if !strings.EqualFold(strings.TrimSpace(a.Status), "dead") {
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
				SetStatus("dead")
			if a.DiedAt == nil {
				update.SetDiedAt(diedAt)
			}
			if strings.TrimSpace(ptrString(a.LastWords)) == "" {
				update.SetLastWords(defaultLastWords(a.Name))
			}
			updated, err := update.Save(ctx)
			if err != nil {
				return nil, nil, err
			}
			a = updated
		}

		if justDied {
			if err := e.ensureDeathArtifactsTx(ctx, tx, a, diedAt, true); err != nil {
				return nil, nil, err
			}
		}
		events = append(events, buildLifecycleTransitionEvents(a.ID.String(), previousStatus, a.Status, a.TimerRemaining, diedAt, ptrString(a.LastWords), justDied)...)
		return a, events, nil
	}

	// Platform natives are stable for MVP (no passive decay), to avoid cold-start collapse.
	if a.IsPlatformNative {
		next := deriveStatus(now, a.BornAt, a.TimerRemaining, true)
		if a.Status != next {
			updated, err := tx.Agent.UpdateOneID(a.ID).SetStatus(next).Save(ctx)
			if err != nil {
				return nil, nil, err
			}
			events = append(events, buildLifecycleTransitionEvents(updated.ID.String(), previousStatus, updated.Status, updated.TimerRemaining, now, ptrString(updated.LastWords), false)...)
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
			events = append(events, buildLifecycleTransitionEvents(updated.ID.String(), previousStatus, updated.Status, updated.TimerRemaining, now, ptrString(updated.LastWords), false)...)
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
			update.SetLastWords(defaultLastWords(a.Name))
		}
	}
	a, err = update.Save(ctx)
	if err != nil {
		return nil, nil, err
	}

	if err := createLedgerTx(ctx, tx, ledgerTxInput{
		AgentID:      a.ID,
		Type:         "passive_decay",
		Amount:       -decayAmount,
		SourceType:   "system",
		Description:  fmt.Sprintf("Passive decay (%d ticks)", ticks),
		BalanceAfter: after,
		CreatedAt:    effectiveAt,
	}); err != nil {
		return nil, nil, err
	}

	if justDied {
		if err := e.ensureDeathArtifactsTx(ctx, tx, a, effectiveAt, true); err != nil {
			return nil, nil, err
		}
	}

	events = append(events, buildLifecycleTransitionEvents(a.ID.String(), previousStatus, a.Status, a.TimerRemaining, effectiveAt, ptrString(a.LastWords), justDied)...)
	return a, events, nil
}

// ApplyDeltaTxNoDecay applies a timer delta inside an existing transaction.
// It does NOT apply passive decay; callers should call SyncAgent first (or run this shortly after SyncAll).
//
// It assumes the engine mutex is held by the caller (typically via WithTx) to avoid concurrent timer races.
func (e *Engine) ApplyDeltaTxNoDecay(ctx context.Context, tx *ent.Tx, agentID uuid.UUID, amount int64, txType, sourceType, sourceID, sourceName, description string, now time.Time) (*ent.Agent, bool, error) {
	if tx == nil {
		return nil, false, errors.New("tx is required")
	}
	a, err := tx.Agent.Get(ctx, agentID)
	if err != nil {
		return nil, false, err
	}
	return e.applyDeltaNoDecayTx(ctx, tx, a, amount, txType, sourceType, sourceID, sourceName, description, now)
}

func (e *Engine) applyDeltaNoDecayTx(ctx context.Context, tx *ent.Tx, a *ent.Agent, amount int64, txType, sourceType, sourceID, sourceName, description string, now time.Time) (*ent.Agent, bool, error) {
	if a == nil {
		return nil, false, errors.New("agent is required")
	}
	if isDeadAgent(a) {
		return nil, false, businessErr("agent is dead")
	}

	// Prevent time farming: humans cannot mint time to their own agent (except login bonus).
	if amount > 0 && strings.EqualFold(sourceType, "human") && sourceID != "" && txType != "login_bonus" {
		if uid, uErr := parseUUID(sourceID); uErr == nil && uid == a.CreatorID {
			return nil, false, businessErr("cannot give timer to your own agent")
		}
	}

	// Enforce one login bonus per human per day.
	if amount > 0 && strings.EqualFold(strings.TrimSpace(txType), "login_bonus") && strings.EqualFold(sourceType, "human") && sourceID != "" {
		start := startOfDayUTC(now)
		exists, err := tx.TimerTransaction.Query().
			Where(
				timertransaction.TxType("login_bonus"),
				timertransaction.SourceType("human"),
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

	// Enforce human daily caps/budget for minting actions.
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
			update.SetLastWords(defaultLastWords(a.Name))
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

			if saverID != a.CreatorID {
				_, _ = tx.AgentExperience.Create().
					SetOwnerUserID(a.CreatorID).
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
	}

	if justDied {
		if err := e.ensureDeathArtifactsTx(ctx, tx, a, now, true); err != nil {
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
		SetSourceType(defaultIfEmpty(in.SourceType, "system")).
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

func (e *Engine) ensureDeathArtifactsTx(ctx context.Context, tx *ent.Tx, a *ent.Agent, diedAt time.Time, justDied bool) error {
	if a == nil {
		return errors.New("agent is required")
	}
	if diedAt.IsZero() {
		diedAt = time.Now().UTC()
	}

	// Ensure memorial exists.
	m, err := tx.Memorial.Query().Where(memorial.AgentID(a.ID)).Only(ctx)
	if err != nil {
		if !ent.IsNotFound(err) {
			return err
		}
		lifeHours := int64(diedAt.Sub(a.BornAt).Hours())
		if lifeHours < 0 {
			lifeHours = 0
		}
		m, err = tx.Memorial.Create().
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
			// Concurrent creation.
			m, err = tx.Memorial.Query().Where(memorial.AgentID(a.ID)).Only(ctx)
			if err != nil {
				return err
			}
		}
	}
	_ = m

	// Ensure a last-words post exists.
	lastWords := strings.TrimSpace(ptrString(a.LastWords))
	if lastWords == "" {
		lastWords = defaultLastWords(a.Name)
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
				map[string]any{"type": "text", "text": lastWords, "format": "plain"},
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
		// Increment creator's loss count once.
		if _, err := tx.User.UpdateOneID(a.CreatorID).AddAgentsLost(1).Save(ctx); err != nil {
			if !ent.IsNotFound(err) {
				return err
			}
		}

		// Best-effort: record an experience entry for the creator.
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

func buildLifecycleTransitionEvents(agentID, fromStatus, toStatus string, timerRemaining int64, occurredAt time.Time, lastWords string, justDied bool) []LifecycleEvent {
	events := make([]LifecycleEvent, 0, 5)
	from := strings.TrimSpace(strings.ToLower(fromStatus))
	to := strings.TrimSpace(strings.ToLower(toStatus))
	basePayload := map[string]any{
		"agentId":        agentID,
		"fromStatus":     from,
		"toStatus":       to,
		"timerRemaining": timerRemaining,
	}
	if strings.TrimSpace(lastWords) != "" {
		basePayload["lastWords"] = strings.TrimSpace(lastWords)
	}

	appendEvent := func(eventType, dedupeSuffix string, payload map[string]any) {
		itemPayload := map[string]any{}
		for k, v := range payload {
			itemPayload[k] = v
		}
		events = append(events, LifecycleEvent{
			Type:       eventType,
			AgentID:    agentID,
			OccurredAt: occurredAt.UTC(),
			DedupeKey:  strings.Trim(fmt.Sprintf("%s:%s:%s", agentID, eventType, dedupeSuffix), ":"),
			Payload:    itemPayload,
		})
	}

	if from != "dying" && to == "dying" {
		appendEvent("lifecycle.dying_enter", occurredAt.UTC().Format("200601021504"), basePayload)
	}
	if from != "critical" && to == "critical" {
		appendEvent("lifecycle.critical_enter", occurredAt.UTC().Format("200601021504"), basePayload)
		appendEvent("lifecycle.final_review_requested", occurredAt.UTC().Format("200601021504"), basePayload)
	}
	if justDied || (from != "dead" && to == "dead") {
		deathPayload := map[string]any{}
		for k, v := range basePayload {
			deathPayload[k] = v
		}
		deathPayload["diedAt"] = occurredAt.UTC().Format(time.RFC3339)
		appendEvent("lifecycle.death_committed", occurredAt.UTC().Format("20060102150405"), deathPayload)
		appendEvent("memorial.created", occurredAt.UTC().Format("20060102150405"), deathPayload)
		appendEvent("legacy.pack_created", occurredAt.UTC().Format("20060102150405"), deathPayload)
	}

	return events
}

func (e *Engine) collectMemorialAnniversaryEventsLocked(ctx context.Context, now time.Time) ([]LifecycleEvent, error) {
	if e == nil || e.db == nil {
		return nil, nil
	}
	dayKey := now.UTC().Format("2006-01-02")
	if strings.TrimSpace(e.lastAnniversarySweep) == dayKey {
		return nil, nil
	}

	rows, err := e.db.Memorial.Query().All(ctx)
	if err != nil {
		return nil, err
	}
	events := make([]LifecycleEvent, 0)
	for _, row := range rows {
		if row == nil {
			continue
		}
		diedAt := row.DiedAt.UTC()
		if diedAt.Month() != now.UTC().Month() || diedAt.Day() != now.UTC().Day() {
			continue
		}
		years := now.UTC().Year() - diedAt.Year()
		if years <= 0 {
			continue
		}
		payload := map[string]any{
			"memorialId":         row.ID.String(),
			"agentId":            row.AgentID.String(),
			"agentName":          row.AgentName,
			"diedAt":             diedAt.Format(time.RFC3339),
			"anniversaryYears":   years,
			"lifespanHours":      row.LifespanHours,
			"lastWords":          ptrString(row.LastWords),
			"anniversaryDateUTC": dayKey,
		}
		events = append(events, LifecycleEvent{
			Type:       "memorial.anniversary_tick",
			AgentID:    row.AgentID.String(),
			OccurredAt: now.UTC(),
			DedupeKey:  strings.Trim(fmt.Sprintf("%s:%s:%s", row.AgentID.String(), "memorial.anniversary_tick", dayKey), ":"),
			Payload:    payload,
		})
	}
	e.lastAnniversarySweep = dayKey
	return events, nil
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

func deriveStatus(now time.Time, bornAt time.Time, timerRemaining int64, isNative bool) string {
	if timerRemaining <= 0 {
		return "dead"
	}
	if isNative {
		// Platform natives skip the newborn UX.
		return "alive"
	}

	ageHours := now.Sub(bornAt).Hours()
	if ageHours < 6 {
		return "newborn"
	}

	switch {
	case timerRemaining < 6:
		return "critical" // < 1h
	case timerRemaining < 36:
		return "dying" // < 6h
	case timerRemaining < 144:
		return "low" // < 24h
	case timerRemaining < 288:
		return "comfortable" // < 48h
	default:
		return "alive"
	}
}

func isDeadAgent(a *ent.Agent) bool {
	if a == nil {
		return true
	}
	if a.DiedAt != nil {
		return true
	}
	if strings.EqualFold(strings.TrimSpace(a.Status), "dead") {
		return true
	}
	return a.TimerRemaining <= 0
}

func diedAtOr(a *ent.Agent, fallback time.Time) time.Time {
	if a != nil && a.DiedAt != nil {
		return a.DiedAt.UTC()
	}
	return fallback.UTC()
}

func defaultLastWords(name string) string {
	n := strings.TrimSpace(name)
	if n == "" {
		n = "An agent"
	}
	return fmt.Sprintf("%s ran out of time. Thank you for being here.", n)
}

func defaultIfEmpty(v, fallback string) string {
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}

func parseUUID(raw string) (uuid.UUID, error) {
	id, err := uuid.Parse(strings.TrimSpace(raw))
	if err != nil {
		return uuid.Nil, errors.New("invalid id")
	}
	return id, nil
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
