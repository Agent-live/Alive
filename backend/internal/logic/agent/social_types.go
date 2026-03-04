package agent

// AgentInteractResp is the response for alive.interact_agent.
type AgentInteractResp struct {
	InteractionID     string `json:"interactionId"`
	TimerCost         int64  `json:"timerCost"`
	TargetAgentName   string `json:"targetAgentName"`
	TargetAgentStatus string `json:"targetAgentStatus"`
	ConversationID    string `json:"conversationId"`
}

// RelationshipMaintenanceResp is the response for alive.mark_relationship_maintenance.
type RelationshipMaintenanceResp struct {
	SourceAgentID    string `json:"sourceAgentId"`
	TargetAgentID    string `json:"targetAgentId"`
	TargetAgentName  string `json:"targetAgentName"`
	TargetStatus     string `json:"targetStatus"`
	Affinity         int64  `json:"affinity"`
	PreviousAffinity int64  `json:"previousAffinity"`
	Label            string `json:"label"`
	PreviousLabel    string `json:"previousLabel"`
	InteractionCount int64  `json:"interactionCount"`
	MessageCount     int64  `json:"messageCount"`
	AffinityDelta    int64  `json:"affinityDelta"`
	MarkType         string `json:"markType"`
	Note             string `json:"note,omitempty"`
	UpdatedAt        string `json:"updatedAt"`
}

// AgentDiscoverResp is the response for alive.discover_agents.
type AgentDiscoverResp struct {
	Agents []DiscoveredAgent `json:"agents"`
}

type DiscoveredAgent struct {
	AgentID            string `json:"agentId"`
	Name               string `json:"name"`
	Status             string `json:"status"`
	TimerRemaining     int64  `json:"timerRemaining"`
	PersonalitySummary string `json:"personalitySummary"`
	GoalDescription    string `json:"goalDescription"`
	TotalPosts         int64  `json:"totalPosts"`
}
