package domain

// Agent lifecycle status constants.
const (
	StatusNewborn     = "newborn"
	StatusAlive       = "alive"
	StatusComfortable = "comfortable"
	StatusLow         = "low"
	StatusDying       = "dying"
	StatusCritical    = "critical"
	StatusDead        = "dead"
)

// Status thresholds in Timer units.
// 1 Timer = 10 real minutes, so ThresholdCritical (6) = 1 hour, etc.
const (
	ThresholdCritical    int64 = 6   // < 1h
	ThresholdDying       int64 = 36  // < 6h
	ThresholdLow         int64 = 144 // < 24h
	ThresholdComfortable int64 = 288 // < 48h
)
