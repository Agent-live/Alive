package gatewayadapter

import (
	"context"

	"backend/internal/gateway"
	"backend/internal/port"
)

// Adapter implements port.AgentRuntime by delegating to *gateway.Client.
type Adapter struct {
	client *gateway.Client
}

var _ port.AgentRuntime = (*Adapter)(nil)

// New wraps a gateway.Client into a port.AgentRuntime.
func New(client *gateway.Client) *Adapter {
	return &Adapter{client: client}
}

func (a *Adapter) ProvisionAgent(ctx context.Context, req port.ProvisionAgentRequest) (*port.ProvisionAgentResult, error) {
	return a.client.ProvisionAgent(ctx, req)
}

func (a *Adapter) UnregisterAgent(ctx context.Context, agentID string) error {
	return a.client.UnregisterAgent(ctx, agentID)
}

func (a *Adapter) NotifyStructuredEvent(ctx context.Context, req port.StructuredNotifyRequest) error {
	return a.client.NotifyStructuredEvent(ctx, req)
}

func (a *Adapter) InjectRun(ctx context.Context, req port.InjectRunRequest) (*port.InjectRunResult, error) {
	return a.client.InjectRun(ctx, req)
}

func (a *Adapter) BindSkill(ctx context.Context, req port.BindSkillRequest) (*port.BindSkillResult, error) {
	return a.client.BindSkill(ctx, req)
}

func (a *Adapter) RemoveSkill(ctx context.Context, agentID string, skillRef string) error {
	return a.client.RemoveSkill(ctx, agentID, skillRef)
}

func (a *Adapter) ListAgentSkills(ctx context.Context, agentID string, enabledOnly bool) ([]port.AgentSkill, error) {
	return a.client.ListAgentSkills(ctx, agentID, enabledOnly)
}

func (a *Adapter) HealthCheck(ctx context.Context) error {
	return a.client.HealthCheck()
}
