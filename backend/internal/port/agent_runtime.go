package port

import (
	"context"
	"encoding/json"
)

// AgentRuntime abstracts the AliveAgent gateway so business logic never
// imports the concrete gateway client package.
type AgentRuntime interface {
	ProvisionAgent(ctx context.Context, req ProvisionAgentRequest) (*ProvisionAgentResult, error)
	UnregisterAgent(ctx context.Context, agentID string) error
	NotifyStructuredEvent(ctx context.Context, req StructuredNotifyRequest) error
	InjectRun(ctx context.Context, req InjectRunRequest) (*InjectRunResult, error)
	BindSkill(ctx context.Context, req BindSkillRequest) (*BindSkillResult, error)
	RemoveSkill(ctx context.Context, agentID string, skillRef string) error
	ListAgentSkills(ctx context.Context, agentID string, enabledOnly bool) ([]AgentSkill, error)
	HealthCheck(ctx context.Context) error
}

// ProvisionAgentRequest is the canonical type for agent provisioning requests.
type ProvisionAgentRequest struct {
	AgentID         string
	Name            string
	Soul            *ProvisionAgentSoul
	GoalDescription string
	Personality     json.RawMessage
	UserSettings    *ProvisionAgentUserSettings
	Memory          *ProvisionAgentMemorySeed
	NativeSkills    []ProvisionAgentNativeSkill
}

// ProvisionAgentResult is the canonical result from agent provisioning.
type ProvisionAgentResult struct {
	GatewayID      string
	AgentRuntimeID string
}

// ProvisionAgentSoul represents the soul/identity of an agent.
type ProvisionAgentSoul struct {
	Identity     string   `json:"identity"`
	Narrative    string   `json:"narrative,omitempty"`
	BehaviorTags []string `json:"behaviorTags,omitempty"`
}

// ProvisionAgentUserSettings represents the owner's settings for provisioning.
type ProvisionAgentUserSettings struct {
	UserID   string `json:"id,omitempty"`
	Nickname string `json:"nickname,omitempty"`
	Theme    string `json:"theme,omitempty"`
	Language string `json:"language,omitempty"`
}

// ProvisionAgentMemorySeed represents optional memory seed for provisioning.
type ProvisionAgentMemorySeed struct {
	UserProfile    map[string]any `json:"userProfile,omitempty"`
	AgentSelfModel map[string]any `json:"agentSelfModel,omitempty"`
	Core           []any          `json:"core,omitempty"`
	Recent         []any          `json:"recent,omitempty"`
}

// ProvisionAgentNativeSkill represents a built-in skill for provisioning.
type ProvisionAgentNativeSkill struct {
	Key                    string   `json:"key,omitempty"`
	Name                   string   `json:"name"`
	Description            string   `json:"description,omitempty"`
	InstructionMarkdown    string   `json:"instructionMarkdown"`
	Tags                   []string `json:"tags,omitempty"`
	Enabled                bool     `json:"enabled"`
	Kind                   string   `json:"kind,omitempty"`
	DisableModelInvocation bool     `json:"disableModelInvocation,omitempty"`
}

// StructuredNotifyRequest is the canonical type for event notifications.
type StructuredNotifyRequest struct {
	RuntimeAgentID string
	AgentID        string
	EventType      string
	Title          string
	Message        string
	SessionKey     string
	DedupeKey      string
	Payload        map[string]any
	TimeoutSeconds int64
}

// InjectRunRequest is the canonical type for injecting a run into an agent.
type InjectRunRequest struct {
	AgentID        string
	SessionKey     string
	RequestID      string
	Message        string
	TimeoutSeconds int64
	Metadata       map[string]string
}

// InjectRunResult is the canonical result from injecting a run.
type InjectRunResult struct {
	RequestID string
}

// BindSkillRequest is the canonical type for binding a skill to an agent.
type BindSkillRequest struct {
	AgentID      string
	SkillName    string
	Description  string
	Instructions string
}

// BindSkillResult is the canonical result from binding a skill.
type BindSkillResult struct {
	GatewayID string
	SkillID   string
}

// AgentSkill represents a skill exposed by the agent runtime.
type AgentSkill struct {
	AgentID                string   `json:"agentId"`
	Key                    string   `json:"key"`
	Name                   string   `json:"name"`
	Description            string   `json:"description"`
	Tags                   []string `json:"tags"`
	Enabled                bool     `json:"enabled"`
	Kind                   string   `json:"kind"`
	Source                 string   `json:"source"`
	RunCount               int64    `json:"runCount"`
	SuccessCount           int64    `json:"successCount"`
	FailureCount           int64    `json:"failureCount"`
	AvgElapsedMs           int64    `json:"avgElapsedMs"`
	LastError              string   `json:"lastError"`
	CreatedAt              string   `json:"createdAt"`
	UpdatedAt              string   `json:"updatedAt"`
	FilePath               string   `json:"filePath"`
	InstructionMarkdown    string   `json:"instructionMarkdown"`
	DisableModelInvocation bool     `json:"disableModelInvocation"`
}
