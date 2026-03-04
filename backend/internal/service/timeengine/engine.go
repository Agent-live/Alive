package timeengine

import (
	"context"
	"errors"
	"strings"
	"sync"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/internal/domain"
	"backend/internal/service/lifecycle"

	"github.com/google/uuid"
)

// Re-export domain timer constants so existing callers (e.g. svc/bootstrap.go)
// that reference timeengine.InitialTimer keep compiling.
const (
	TimerUnitDuration   = domain.TimerUnitDuration
	InitialTimer        = domain.InitialTimer
	PassiveDecayPerUnit = domain.PassiveDecayPerUnit
	DailyTimerBudget    = domain.DailyTimerBudget
	DailyLikesMax       = domain.DailyLikesMax
	DailyRepliesMax     = domain.DailyRepliesMax
	DailySharesMax      = domain.DailySharesMax
	DailySavesMax       = domain.DailySavesMax
)

// Re-export domain types for backward compatibility.
type LifecycleEvent = domain.LifecycleEvent
type LifecycleEventHook = domain.LifecycleEventHook

// DeathArtifactHook is called when an agent dies.
type DeathArtifactHook func(ctx context.Context, tx *ent.Tx, a *ent.Agent, diedAt time.Time, justDied bool) error

type Engine struct {
	db *ent.Client

	enabled   bool
	interval  time.Duration
	eventHook domain.LifecycleEventHook
	deathHook DeathArtifactHook

	lifecycleMu          sync.Mutex
	agentLocks           sync.Map // key: agentID string, value: *sync.Mutex
	stop                 chan struct{}
	done                 chan struct{}
	lastAnniversarySweep string
}

type TxFunc func(tx *ent.Tx, now time.Time) error

// BusinessError represents a rule-level rejection (budget/limits/dead agent/etc).
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
	EventHook domain.LifecycleEventHook
	DeathHook DeathArtifactHook
}

func New(db *ent.Client, opts Options) *Engine {
	interval := opts.Interval
	if interval <= 0 {
		interval = time.Minute
	}
	deathHook := opts.DeathHook
	if deathHook == nil {
		deathHook = lifecycle.DefaultDeathArtifactHook
	}
	return &Engine{
		db:        db,
		enabled:   opts.Enabled,
		interval:  interval,
		eventHook: opts.EventHook,
		deathHook: deathHook,
	}
}

func (e *Engine) Start() {
	if !e.enabled || e.db == nil {
		return
	}
	e.lifecycleMu.Lock()
	if e.stop != nil {
		e.lifecycleMu.Unlock()
		return
	}
	stop := make(chan struct{})
	done := make(chan struct{})
	e.stop = stop
	e.done = done
	e.lifecycleMu.Unlock()

	go func() {
		defer close(done)
		_ = e.SyncAll(context.Background())
		ticker := time.NewTicker(e.interval)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				_ = e.SyncAll(context.Background())
			case <-stop:
				return
			}
		}
	}()
}

func (e *Engine) Stop() {
	e.lifecycleMu.Lock()
	stop := e.stop
	done := e.done
	e.stop = nil
	e.done = nil
	e.lifecycleMu.Unlock()

	if stop == nil {
		return
	}
	close(stop)
	<-done
}

func (e *Engine) emitLifecycleEvents(events []domain.LifecycleEvent) {
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

func (e *Engine) withAgentLock(agentID uuid.UUID, fn func() error) error {
	lockKey := agentID.String()
	lockAny, _ := e.agentLocks.LoadOrStore(lockKey, &sync.Mutex{})
	lock := lockAny.(*sync.Mutex)
	lock.Lock()
	defer lock.Unlock()
	return fn()
}

// WithTx runs fn inside a DB transaction.
// Timer mutation paths use per-agent locks; generic business writes do not
// need the old global engine lock.
func (e *Engine) WithTx(ctx context.Context, fn TxFunc) error {
	if e.db == nil {
		return errors.New("db is not available")
	}
	if fn == nil {
		return errors.New("fn is required")
	}

	now := time.Now().UTC()

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
func (e *Engine) SyncAll(ctx context.Context) error {
	if e.db == nil {
		return nil
	}

	now := time.Now().UTC()

	agents, err := e.db.Agent.Query().
		Where(agent.StatusNotIn(domain.StatusDead)).
		All(ctx)
	if err != nil {
		return err
	}

	for _, a := range agents {
		if a == nil {
			continue
		}
		_ = e.withAgentLock(a.ID, func() error {
			_, err := e.syncAgentTx(ctx, a.ID, now)
			return err
		})
	}

	e.lifecycleMu.Lock()
	lastSweep := e.lastAnniversarySweep
	e.lifecycleMu.Unlock()
	if anniversaryEvents, dayKey, annErr := lifecycle.CollectAnniversaryEvents(ctx, e.db, lastSweep, now); annErr == nil {
		e.lifecycleMu.Lock()
		e.lastAnniversarySweep = dayKey
		e.lifecycleMu.Unlock()
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

	var out *ent.Agent
	err = e.withAgentLock(id, func() error {
		var syncErr error
		out, syncErr = e.syncAgentTx(ctx, id, now)
		return syncErr
	})
	if err != nil {
		return nil, err
	}
	return out, nil
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
	return e.withAgentLock(id, func() error {
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
			if err := e.deathHook(ctx, tx, a, diedAtOr(a, now), false); err != nil {
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
	})
}

func (e *Engine) syncAgentTx(ctx context.Context, id uuid.UUID, now time.Time) (*ent.Agent, error) {
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
		if err := e.deathHook(ctx, tx, a, diedAtOr(a, now), false); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	e.emitLifecycleEvents(lifecycleEvents)
	return a, nil
}
