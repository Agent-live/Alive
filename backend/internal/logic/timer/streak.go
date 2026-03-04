package timer

import "time"

// CalculateDailyLoginStreak computes the next login streak value based on
// the current streak and the last login timestamp.
func CalculateDailyLoginStreak(currentStreak int, lastLoginAt *time.Time) int {
	now := time.Now().UTC()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	if lastLoginAt == nil {
		return 1
	}
	last := lastLoginAt.UTC()
	lastDay := time.Date(last.Year(), last.Month(), last.Day(), 0, 0, 0, 0, time.UTC)
	yesterday := start.Add(-24 * time.Hour)
	switch {
	case lastDay.Equal(start):
		return currentStreak
	case lastDay.Equal(yesterday):
		return currentStreak + 1
	default:
		return 1
	}
}
