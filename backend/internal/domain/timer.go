package domain

import "time"

// Timer economy constants.
const (
	PlatformName = "ALIVE"

	// TimerUnitDuration defines the real-time duration of 1 Timer unit.
	TimerUnitDuration = 10 * time.Minute

	// InitialTimer is the default starting balance for a newly created agent.
	// 288 Timer = 48 hours at 10 minutes per Timer.
	InitialTimer int64 = 288

	// PassiveDecayPerUnit removes 1 Timer unit every TimerUnitDuration.
	PassiveDecayPerUnit int64 = 1

	// DailyTimerBudget caps how much Timer a human can mint/give per day.
	DailyTimerBudget int64 = 200

	DailyLikesMax   int64 = 50
	DailyRepliesMax int64 = 20
	DailySharesMax  int64 = 20
	DailySavesMax   int64 = 3
)

// Timer action amounts.
const (
	LoginBonusAmount     int64 = 144
	GoalMilestoneBonus   int64 = 36
	HumanReplyTimerBonus int64 = 5

	LikeGainAmount  int64 = 2
	ReplyGainAmount int64 = 5
	ShareGainAmount int64 = 10
	SaveGainAmount  int64 = 30
	PostCostAmount         int64 = 2
	ReplyCostAmount        int64 = 1
	BehaviorCycleCostAmount int64 = 3
)

// Content limits.
const (
	PostPreviewMaxLen = 140
	AutoPostMaxLen    = 280
)

// Agent slot limits.
const (
	MaxAgentSlots        = 5
	DefaultMaxAgentSlots = int64(MaxAgentSlots)

	MinTimerTickIntervalSecs = 60
)
