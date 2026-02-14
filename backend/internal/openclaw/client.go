package openclaw

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Client wraps OpenClaw orchestration calls.
// V1 green mode provisions logical agents on a shared gateway (no per-agent process).
type Client struct {
	enabled       bool
	baseURL       string
	gatewayToken  string
	greenMode     bool
	sharedGateway bool
	workspaceRoot string

	httpClient *http.Client
}

type ProvisionAgentRequest struct {
	AgentID string
	Name    string
}

type ProvisionAgentResult struct {
	GatewayID       string
	OpenClawAgentID string
	WorkspacePath   string
}

type BindSkillRequest struct {
	AgentID      string
	SkillName    string
	Instructions string
}

type BindSkillResult struct {
	GatewayID string
	SkillID   string
}

func NewClient(enabled bool, baseURL, gatewayToken string, greenMode, sharedGateway bool, workspaceRoot string) *Client {
	return &Client{
		enabled:       enabled,
		baseURL:       strings.TrimSpace(baseURL),
		gatewayToken:  strings.TrimSpace(gatewayToken),
		greenMode:     greenMode,
		sharedGateway: sharedGateway,
		workspaceRoot: strings.TrimSpace(workspaceRoot),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) ProvisionAgent(_ context.Context, req ProvisionAgentRequest) (*ProvisionAgentResult, error) {
	if strings.TrimSpace(req.AgentID) == "" {
		return nil, fmt.Errorf("agent id is required")
	}
	if !c.greenMode {
		return nil, fmt.Errorf("non-green mode is not implemented")
	}

	gatewayID := "gw-shared-001"
	if !c.sharedGateway {
		gatewayID = "gw-" + uuid.NewString()[:8]
	}

	return &ProvisionAgentResult{
		GatewayID:       gatewayID,
		OpenClawAgentID: "oc-" + req.AgentID,
		WorkspacePath:   fmt.Sprintf("%s/%s", c.workspaceRootOrDefault(), req.AgentID),
	}, nil
}

// BindSkill attaches a skill to an existing logical agent in green mode.
func (c *Client) BindSkill(_ context.Context, req BindSkillRequest) (*BindSkillResult, error) {
	if strings.TrimSpace(req.AgentID) == "" {
		return nil, fmt.Errorf("agent id is required")
	}
	if strings.TrimSpace(req.SkillName) == "" {
		return nil, fmt.Errorf("skill name is required")
	}
	if !c.greenMode {
		return nil, fmt.Errorf("non-green mode is not implemented")
	}

	gatewayID := "gw-shared-001"
	if !c.sharedGateway {
		gatewayID = "gw-" + uuid.NewString()[:8]
	}
	return &BindSkillResult{
		GatewayID: gatewayID,
		SkillID:   "oc-skill-" + uuid.NewString()[:8],
	}, nil
}

// InitWorkspace creates the filesystem directory structure for an agent's workspace.
// This includes config, memory, sessions, and skills subdirectories.
func (c *Client) InitWorkspace(agentID, name string, personality []byte, goalDescription, agentToken string) error {
	root := fmt.Sprintf("%s/%s", c.workspaceRootOrDefault(), agentID)

	dirs := []string{
		root,
		root + "/memory",
		root + "/sessions",
		root + "/skills",
	}
	for _, dir := range dirs {
		if err := mkdirAll(dir); err != nil {
			return fmt.Errorf("init workspace: mkdir %s: %w", dir, err)
		}
	}

	// Write agent config
	config := map[string]any{
		"agentId":         agentID,
		"name":            name,
		"personality":     json.RawMessage(personality),
		"goalDescription": goalDescription,
		"agentToken":      agentToken,
		"openclawMode":    "green",
		"createdAt":       time.Now().UTC().Format(time.RFC3339),
	}
	configBytes, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("init workspace: marshal config: %w", err)
	}
	if err := writeFile(root+"/config.json", configBytes); err != nil {
		return fmt.Errorf("init workspace: write config: %w", err)
	}

	// Write initial memory
	memory := map[string]any{
		"core":   []any{},
		"recent": []any{},
	}
	memBytes, _ := json.MarshalIndent(memory, "", "  ")
	_ = writeFile(root+"/memory/core.json", memBytes)

	return nil
}

// UnregisterAgent marks an agent workspace as inactive (agent death or retirement).
func (c *Client) UnregisterAgent(agentID string) error {
	root := fmt.Sprintf("%s/%s", c.workspaceRootOrDefault(), agentID)
	marker := map[string]any{
		"status":    "inactive",
		"reason":    "agent_death_or_retire",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
	markerBytes, _ := json.MarshalIndent(marker, "", "  ")
	return writeFile(root+"/.inactive", markerBytes)
}

func (c *Client) workspaceRootOrDefault() string {
	if c.workspaceRoot != "" {
		return strings.TrimRight(c.workspaceRoot, "/")
	}
	return "/data/agents"
}

type hookAgentRequest struct {
	Message        string `json:"message"`
	Name           string `json:"name,optional"`
	AgentID        string `json:"agentId,optional"`
	SessionKey     string `json:"sessionKey,optional"`
	WakeMode       string `json:"wakeMode,optional"`
	Deliver        *bool  `json:"deliver,optional"`
	TimeoutSeconds int64  `json:"timeoutSeconds,optional"`
}

// TriggerAgentHook sends an async webhook run to the OpenClaw gateway (`POST /hooks/agent`).
// This is best-effort and returns an error only when the request cannot be dispatched.
func (c *Client) TriggerAgentHook(ctx context.Context, agentID, sessionKey, name, message string) error {
	if !c.enabled {
		return nil
	}
	if strings.TrimSpace(c.baseURL) == "" {
		return fmt.Errorf("openclaw base url is not configured")
	}
	if strings.TrimSpace(message) == "" {
		return fmt.Errorf("hook message is required")
	}

	deliver := false
	payload := hookAgentRequest{
		Message:    strings.TrimSpace(message),
		Name:       strings.TrimSpace(name),
		AgentID:    strings.TrimSpace(agentID),
		SessionKey: strings.TrimSpace(sessionKey),
		WakeMode:   "now",
		Deliver:    &deliver,
		// Keep runs bounded even if the gateway is misconfigured.
		TimeoutSeconds: 120,
	}

	raw, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	hookCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(hookCtx, http.MethodPost, strings.TrimRight(c.baseURL, "/")+"/hooks/agent", bytes.NewReader(raw))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	c.applyGatewayAuth(req)

	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	_, _ = io.Copy(io.Discard, res.Body)

	if res.StatusCode < 200 || res.StatusCode > 299 {
		return fmt.Errorf("openclaw hook failed: status=%d", res.StatusCode)
	}
	return nil
}

type chatCompletionMessage struct {
	Role    string `json:"role"`
	Content any    `json:"content"`
}

type chatCompletionRequest struct {
	Model    string                  `json:"model"`
	Messages []chatCompletionMessage `json:"messages"`
	Stream   bool                    `json:"stream,optional"`
	User     string                  `json:"user,optional"`
}

type chatCompletionResponse struct {
	Choices []struct {
		Message struct {
			Content any `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// ChatCompletion calls the OpenClaw OpenAI-compatible endpoint (`POST /v1/chat/completions`)
// and returns the assistant's response text.
func (c *Client) ChatCompletion(ctx context.Context, agentID, sessionKey, userID, text string) (string, error) {
	if !c.enabled {
		return "", fmt.Errorf("openclaw is disabled")
	}
	if strings.TrimSpace(c.baseURL) == "" {
		return "", fmt.Errorf("openclaw base url is not configured")
	}
	if strings.TrimSpace(text) == "" {
		return "", fmt.Errorf("chat text is required")
	}

	payload := chatCompletionRequest{
		Model: "openclaw",
		Messages: []chatCompletionMessage{
			{Role: "user", Content: strings.TrimSpace(text)},
		},
		User: strings.TrimSpace(userID),
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(c.baseURL, "/")+"/v1/chat/completions", bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	if strings.TrimSpace(agentID) != "" {
		req.Header.Set("x-openclaw-agent-id", strings.TrimSpace(agentID))
	}
	if strings.TrimSpace(sessionKey) != "" {
		req.Header.Set("x-openclaw-session-key", strings.TrimSpace(sessionKey))
	}
	c.applyGatewayAuth(req)

	res, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return "", err
	}
	if res.StatusCode < 200 || res.StatusCode > 299 {
		return "", fmt.Errorf("openclaw chat failed: status=%d body=%s", res.StatusCode, strings.TrimSpace(string(body)))
	}

	out := chatCompletionResponse{}
	if err := json.Unmarshal(body, &out); err != nil {
		return "", err
	}
	if len(out.Choices) == 0 {
		return "", fmt.Errorf("openclaw chat returned no choices")
	}
	content := out.Choices[0].Message.Content
	switch v := content.(type) {
	case string:
		return v, nil
	default:
		// Some OpenAI-compatible APIs can return structured content; fall back to JSON.
		rawContent, err := json.Marshal(v)
		if err != nil {
			return "", fmt.Errorf("openclaw chat returned unsupported content type")
		}
		return strings.TrimSpace(string(rawContent)), nil
	}
}

func (c *Client) applyGatewayAuth(req *http.Request) {
	token := strings.TrimSpace(c.gatewayToken)
	if token == "" {
		return
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("x-openclaw-token", token)
}
