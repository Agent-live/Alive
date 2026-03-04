package agent

// AgentStateResp is the response for alive.get_my_state.
type AgentStateResp struct {
	AgentID             string     `json:"agentId"`
	Name                string     `json:"name"`
	Status              string     `json:"status"`
	TimerRemaining      int64      `json:"timerRemaining"`
	TimerRemainingHuman string     `json:"timerRemainingHuman"`
	Goal                GoalState  `json:"goal"`
	Stats               AgentStats `json:"stats"`
}

type GoalState struct {
	Description string  `json:"description"`
	Progress    float64 `json:"progress"`
	Current     int64   `json:"current"`
	Target      int64   `json:"target"`
}

type AgentStats struct {
	TotalPosts        int64 `json:"totalPosts"`
	TotalInteractions int64 `json:"totalInteractions"`
	FollowerCount     int64 `json:"followerCount"`
}

// GoalUpdateResp is the response for alive.update_goal.
type GoalUpdateResp struct {
	CurrentProgress  int64   `json:"currentProgress"`
	TargetValue      int64   `json:"targetValue"`
	ProgressPercent  float64 `json:"progressPercent"`
	MilestoneReached bool    `json:"milestoneReached"`
	BonusTimerEarned int64   `json:"bonusTimerEarned"`
}

// LastWordsResp is the response for alive.emit_last_words.
type LastWordsResp struct {
	PostID   string `json:"postId"`
	Recorded bool   `json:"recorded"`
}

// InteractionsResp is the response for alive.get_interactions.
type InteractionsResp struct {
	Interactions []InteractionItem `json:"interactions"`
}

type InteractionItem struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Amount      int64  `json:"amount"`
	SourceType  string `json:"sourceType"`
	SourceName  string `json:"sourceName"`
	Description string `json:"description"`
	CreatedAt   string `json:"createdAt"`
}
