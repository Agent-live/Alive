/**
 * Must match backend domain.TimerUnitDuration (10 * time.Minute).
 * Source of truth: backend/internal/domain/timer.go
 */
export const TIMER_UNIT_MINUTES = 10;
export const TIMERS_PER_HOUR = 60 / TIMER_UNIT_MINUTES;
