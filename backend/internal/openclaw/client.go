package openclaw

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
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
	Description  string
	Instructions string
	// LocalSourceDir optionally points to a local skill directory to copy into the agent workspace.
	// If provided and copy succeeds, the directory contents are used as-is (SKILL.md, assets, scripts, etc).
	LocalSourceDir string
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

	slug := normalizeSkillSlug(req.SkillName)
	root := fmt.Sprintf("%s/%s", c.workspaceRootOrDefault(), strings.TrimSpace(req.AgentID))
	skillDir := root + "/skills/" + slug

	if err := mkdirAll(skillDir); err != nil {
		return nil, fmt.Errorf("bind skill: mkdir %s: %w", skillDir, err)
	}

	// If we have a local copy of the full skill folder, copy it into the workspace.
	// This preserves extra files like _meta.json, references/, scripts/, etc. and is better for
	// remote Linux gateway deployments than generating a minimal SKILL.md.
	if src := strings.TrimSpace(req.LocalSourceDir); src != "" {
		// Start fresh to avoid stale files when rebinding/upgrading a skill.
		_ = removeAll(skillDir)
		_ = mkdirAll(skillDir)
		if err := copyDir(src, skillDir); err == nil {
			gatewayID := "gw-shared-001"
			if !c.sharedGateway {
				gatewayID = "gw-" + uuid.NewString()[:8]
			}
			return &BindSkillResult{
				GatewayID: gatewayID,
				SkillID:   slug,
			}, nil
		}
		// Ensure the directory is clean before falling back to generated SKILL.md.
		_ = removeAll(skillDir)
		_ = mkdirAll(skillDir)
		// Fall back to generated SKILL.md below.
	}

	// Write a minimal SKILL.md so the gateway can load it from the agent workspace.
	title := strings.TrimSpace(req.SkillName)
	if title == "" {
		title = slug
	}
	desc := strings.TrimSpace(req.Description)
	if desc == "" {
		desc = "ALIVE skill"
	}
	body := strings.TrimSpace(req.Instructions)
	if body == "" {
		return nil, fmt.Errorf("skill instructions are required")
	}

	// YAML frontmatter; description is quoted for safety.
	content := strings.Join([]string{
		"---",
		"name: " + slug,
		"description: " + strconv.Quote(desc),
		"---",
		"",
		"# " + title,
		"",
		body,
		"",
	}, "\n")
	if err := writeFile(skillDir+"/SKILL.md", []byte(content)); err != nil {
		return nil, fmt.Errorf("bind skill: write SKILL.md: %w", err)
	}

	gatewayID := "gw-shared-001"
	if !c.sharedGateway {
		gatewayID = "gw-" + uuid.NewString()[:8]
	}
	return &BindSkillResult{
		GatewayID: gatewayID,
		SkillID:   slug,
	}, nil
}

// RemoveSkill removes a workspace skill directory from an agent's workspace in green mode.
// This is best-effort; callers typically proceed even if the skill directory is already missing.
func (c *Client) RemoveSkill(_ context.Context, agentID, skillRef string) error {
	if strings.TrimSpace(agentID) == "" {
		return fmt.Errorf("agent id is required")
	}
	if strings.TrimSpace(skillRef) == "" {
		return fmt.Errorf("skill ref is required")
	}
	slug := normalizeSkillSlug(skillRef)
	root := fmt.Sprintf("%s/%s", c.workspaceRootOrDefault(), strings.TrimSpace(agentID))
	skillDir := root + "/skills/" + slug
	if err := removeAll(skillDir); err != nil {
		return fmt.Errorf("remove skill: %w", err)
	}
	return nil
}

func normalizeSkillSlug(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	if s == "" {
		return "skill"
	}
	var b strings.Builder
	b.Grow(len(s))
	lastDash := false
	for _, r := range s {
		isAZ := r >= 'a' && r <= 'z'
		is09 := r >= '0' && r <= '9'
		if isAZ || is09 {
			b.WriteRune(r)
			lastDash = false
			continue
		}
		// Treat common separators as '-'.
		if r == '-' || r == ' ' || r == '_' || r == '.' || r == '/' || r == ':' {
			if b.Len() == 0 || lastDash {
				continue
			}
			b.WriteByte('-')
			lastDash = true
			continue
		}
		// Drop other characters.
	}
	out := strings.Trim(b.String(), "-")
	if out == "" {
		return "skill"
	}
	return out
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
