package aliveagent

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Client wraps AliveAgent gateway orchestration calls.
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
	GatewayID      string
	AgentRuntimeID string
	WorkspacePath  string
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

type listAgentSkillsGatewayResponse struct {
	Count  int          `json:"count"`
	Skills []AgentSkill `json:"skills"`
}

type provisionAgentGatewayRequest struct {
	AgentID             string                       `json:"agentId"`
	Workspace           string                       `json:"workspace"`
	MaxParallelSessions uint32                       `json:"maxParallelSessions"`
	AllowedCommands     []string                     `json:"allowedCommands"`
	Sandbox             provisionAgentGatewaySandbox `json:"sandbox"`
	UseWorkspaceRules   bool                         `json:"useWorkspaceRules"`
}

type provisionAgentGatewaySandbox struct {
	Enabled        bool   `json:"enabled"`
	Mode           string `json:"mode"`
	Image          string `json:"image"`
	NetworkEnabled bool   `json:"networkEnabled"`
	TimeoutSeconds uint32 `json:"timeoutSeconds"`
}

type provisionAgentGatewayResponse struct {
	AgentID   string `json:"agentId"`
	Workspace string `json:"workspace"`
}

type injectEventRequest struct {
	Source     string `json:"source"`
	AgentID    string `json:"agentId"`
	SessionKey string `json:"sessionKey"`
	EventID    string `json:"eventId,optional"`
	Payload    any    `json:"payload"`
}

type injectEventResponse struct {
	Accepted bool   `json:"accepted"`
	EventID  string `json:"eventId"`
	Message  string `json:"message"`
}

type InjectEventRequest struct {
	Source     string
	AgentID    string
	SessionKey string
	EventID    string
	Payload    any
}

type InjectEventResult struct {
	Accepted bool
	EventID  string
	Message  string
}

type injectRunRequest struct {
	AgentID        string            `json:"agentId"`
	SessionKey     string            `json:"sessionKey"`
	RequestID      string            `json:"requestId,optional"`
	Message        string            `json:"message"`
	TimeoutSeconds int64             `json:"timeoutSeconds,optional"`
	Metadata       map[string]string `json:"metadata,optional"`
}

type injectRunResponse struct {
	RequestID string `json:"requestId"`
}

type InjectRunRequest struct {
	AgentID        string
	SessionKey     string
	RequestID      string
	Message        string
	TimeoutSeconds int64
	Metadata       map[string]string
}

type InjectRunResult struct {
	RequestID string
}

type NotifyAgentRequest struct {
	AgentID        string
	SessionKey     string
	Title          string
	Message        string
	EventSource    string
	EventType      string
	Payload        map[string]any
	TimeoutSeconds int64
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

func (c *Client) ProvisionAgent(ctx context.Context, req ProvisionAgentRequest) (*ProvisionAgentResult, error) {
	if strings.TrimSpace(req.AgentID) == "" {
		return nil, fmt.Errorf("agent id is required")
	}
	if !c.greenMode {
		return nil, fmt.Errorf("non-green mode is not implemented")
	}

	workspacePath := fmt.Sprintf("%s/%s", c.workspaceRootOrDefault(), strings.TrimSpace(req.AgentID))
	if !c.enabled {
		gatewayID := "gw-shared-001"
		if !c.sharedGateway {
			gatewayID = "gw-" + uuid.NewString()[:8]
		}
		return &ProvisionAgentResult{
			GatewayID:      gatewayID,
			AgentRuntimeID: strings.TrimSpace(req.AgentID),
			WorkspacePath:  workspacePath,
		}, nil
	}
	if strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("agent gateway base url is not configured")
	}

	body := provisionAgentGatewayRequest{
		AgentID:             strings.TrimSpace(req.AgentID),
		Workspace:           workspacePath,
		MaxParallelSessions: 4,
		AllowedCommands:     []string{},
		Sandbox: provisionAgentGatewaySandbox{
			Enabled:        false,
			Mode:           "off",
			Image:          "",
			NetworkEnabled: false,
			TimeoutSeconds: 30,
		},
		UseWorkspaceRules: true,
	}

	requestCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()
	status, raw, err := c.postGatewayJSON(requestCtx, "/agents", body)
	if err != nil {
		if status > 0 {
			return nil, fmt.Errorf("provision agent failed: status=%d body=%s", status, strings.TrimSpace(string(raw)))
		}
		return nil, err
	}

	resp := provisionAgentGatewayResponse{}
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &resp); err != nil {
			return nil, fmt.Errorf("provision agent decode failed: %w", err)
		}
	}
	agentRuntimeID := strings.TrimSpace(resp.AgentID)
	if agentRuntimeID == "" {
		agentRuntimeID = strings.TrimSpace(req.AgentID)
	}
	workspace := strings.TrimSpace(resp.Workspace)
	if workspace == "" {
		workspace = workspacePath
	}

	return &ProvisionAgentResult{
		GatewayID:      strings.TrimRight(c.baseURL, "/"),
		AgentRuntimeID: agentRuntimeID,
		WorkspacePath:  workspace,
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

// ListAgentSkills returns skills exposed by AliveAgent runtime for a specific agent.
func (c *Client) ListAgentSkills(ctx context.Context, agentID string, enabledOnly bool) ([]AgentSkill, error) {
	agentID = strings.TrimSpace(agentID)
	if agentID == "" {
		return nil, fmt.Errorf("agent id is required")
	}
	if !c.enabled {
		return []AgentSkill{}, nil
	}
	if strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("agent gateway base url is not configured")
	}

	query := url.Values{}
	query.Set("agentId", agentID)
	if enabledOnly {
		query.Set("enabledOnly", "true")
	}

	path := "/skills?" + query.Encode()
	requestCtx, cancel := context.WithTimeout(ctx, 4*time.Second)
	defer cancel()
	status, raw, err := c.getGateway(requestCtx, path)
	if err != nil {
		if status > 0 {
			return nil, fmt.Errorf("list skills failed: status=%d body=%s", status, strings.TrimSpace(string(raw)))
		}
		return nil, err
	}

	resp := listAgentSkillsGatewayResponse{}
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &resp); err != nil {
			return nil, fmt.Errorf("list skills decode failed: %w", err)
		}
	}
	if len(resp.Skills) == 0 {
		return []AgentSkill{}, nil
	}
	for idx := range resp.Skills {
		resp.Skills[idx].AgentID = strings.TrimSpace(resp.Skills[idx].AgentID)
		resp.Skills[idx].Key = strings.TrimSpace(resp.Skills[idx].Key)
		resp.Skills[idx].Name = strings.TrimSpace(resp.Skills[idx].Name)
		resp.Skills[idx].Description = strings.TrimSpace(resp.Skills[idx].Description)
		resp.Skills[idx].Kind = strings.TrimSpace(resp.Skills[idx].Kind)
		resp.Skills[idx].Source = strings.TrimSpace(resp.Skills[idx].Source)
		resp.Skills[idx].LastError = strings.TrimSpace(resp.Skills[idx].LastError)
		resp.Skills[idx].CreatedAt = strings.TrimSpace(resp.Skills[idx].CreatedAt)
		resp.Skills[idx].UpdatedAt = strings.TrimSpace(resp.Skills[idx].UpdatedAt)
		resp.Skills[idx].FilePath = strings.TrimSpace(resp.Skills[idx].FilePath)
		resp.Skills[idx].InstructionMarkdown = strings.TrimSpace(resp.Skills[idx].InstructionMarkdown)
	}
	return resp.Skills, nil
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
		"runtimeMode":     "green",
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
	agentID = strings.TrimSpace(agentID)
	if agentID == "" {
		return fmt.Errorf("agent id is required")
	}

	var errs []string
	if c.enabled {
		if strings.TrimSpace(c.baseURL) == "" {
			errs = append(errs, "agent gateway base url is not configured")
		} else {
			sleepCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			_, raw, err := c.postGatewayJSON(
				sleepCtx,
				"/management/agents/"+agentID+"/sleep",
				map[string]any{"durationSeconds": int64(31536000)},
			)
			cancel()
			if err != nil {
				errs = append(errs, "sleep agent failed: "+err.Error()+" body="+strings.TrimSpace(string(raw)))
			}
		}
	}

	root := fmt.Sprintf("%s/%s", c.workspaceRootOrDefault(), agentID)
	marker := map[string]any{
		"status":    "inactive",
		"reason":    "agent_death_or_retire",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
	markerBytes, _ := json.MarshalIndent(marker, "", "  ")
	if err := writeFile(root+"/.inactive", markerBytes); err != nil {
		errs = append(errs, "write inactive marker failed: "+err.Error())
	}

	if len(errs) > 0 {
		return fmt.Errorf("%s", strings.Join(errs, "; "))
	}
	return nil
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

func (c *Client) InjectEvent(ctx context.Context, req InjectEventRequest) (*InjectEventResult, error) {
	if !c.enabled {
		return nil, fmt.Errorf("agent gateway is disabled")
	}
	if strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("agent gateway base url is not configured")
	}

	source := strings.TrimSpace(req.Source)
	if source == "" {
		return nil, fmt.Errorf("event source is required")
	}
	agentID := strings.TrimSpace(req.AgentID)
	if agentID == "" {
		return nil, fmt.Errorf("agent id is required")
	}
	sessionKey := strings.TrimSpace(req.SessionKey)
	if sessionKey == "" {
		sessionKey = "main"
	}

	body := injectEventRequest{
		Source:     source,
		AgentID:    agentID,
		SessionKey: sessionKey,
		EventID:    strings.TrimSpace(req.EventID),
		Payload:    req.Payload,
	}
	if body.Payload == nil {
		body.Payload = map[string]any{}
	}

	requestCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	status, raw, err := c.postGatewayJSON(requestCtx, "/inject/events", body)
	if err != nil {
		if status > 0 {
			return nil, fmt.Errorf("inject event failed: status=%d body=%s", status, strings.TrimSpace(string(raw)))
		}
		return nil, err
	}

	out := injectEventResponse{}
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &out); err != nil {
			return nil, err
		}
	}
	return &InjectEventResult{
		Accepted: out.Accepted,
		EventID:  out.EventID,
		Message:  out.Message,
	}, nil
}

func (c *Client) InjectRun(ctx context.Context, req InjectRunRequest) (*InjectRunResult, error) {
	if !c.enabled {
		return nil, fmt.Errorf("agent gateway is disabled")
	}
	if strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("agent gateway base url is not configured")
	}

	agentID := strings.TrimSpace(req.AgentID)
	if agentID == "" {
		return nil, fmt.Errorf("agent id is required")
	}
	message := strings.TrimSpace(req.Message)
	if message == "" {
		return nil, fmt.Errorf("message is required")
	}

	sessionKey := strings.TrimSpace(req.SessionKey)
	if sessionKey == "" {
		sessionKey = "main"
	}
	timeoutSeconds := req.TimeoutSeconds
	if timeoutSeconds <= 0 {
		timeoutSeconds = 120
	}

	body := injectRunRequest{
		AgentID:        agentID,
		SessionKey:     sessionKey,
		RequestID:      strings.TrimSpace(req.RequestID),
		Message:        message,
		TimeoutSeconds: timeoutSeconds,
		Metadata:       req.Metadata,
	}

	requestCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	status, raw, err := c.postGatewayJSON(requestCtx, "/inject/run", body)
	if err != nil {
		if status > 0 {
			return nil, fmt.Errorf("inject run failed: status=%d body=%s", status, strings.TrimSpace(string(raw)))
		}
		return nil, err
	}

	out := injectRunResponse{}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &out)
	}
	return &InjectRunResult{RequestID: out.RequestID}, nil
}

// NotifyAgent delivers a structured event first and falls back to legacy hook delivery.
func (c *Client) NotifyAgent(ctx context.Context, req NotifyAgentRequest) error {
	if !c.enabled {
		return nil
	}
	agentID := strings.TrimSpace(req.AgentID)
	if agentID == "" {
		return fmt.Errorf("agent id is required")
	}
	message := strings.TrimSpace(req.Message)
	if message == "" {
		return fmt.Errorf("message is required")
	}
	title := strings.TrimSpace(req.Title)
	if title == "" {
		title = "ALIVE Notification"
	}
	source := strings.TrimSpace(req.EventSource)
	if source == "" {
		source = "alive.notification"
	}
	sessionKey := strings.TrimSpace(req.SessionKey)
	if sessionKey == "" {
		sessionKey = "main"
	}

	payload := map[string]any{}
	for k, v := range req.Payload {
		payload[k] = v
	}
	payload["title"] = title
	payload["message"] = message
	if eventType := strings.TrimSpace(req.EventType); eventType != "" {
		payload["eventType"] = eventType
	}

	injectResult, injectErr := c.InjectEvent(ctx, InjectEventRequest{
		Source:     source,
		AgentID:    agentID,
		SessionKey: sessionKey,
		Payload:    payload,
	})
	if injectErr == nil {
		metadata := map[string]string{
			"source": source,
		}
		if req.EventType != "" {
			metadata["eventType"] = strings.TrimSpace(req.EventType)
		}
		if injectResult != nil && strings.TrimSpace(injectResult.EventID) != "" {
			metadata["eventId"] = strings.TrimSpace(injectResult.EventID)
		}
		if req.TimeoutSeconds > 0 {
			metadata["timeoutSeconds"] = strconv.FormatInt(req.TimeoutSeconds, 10)
		}
		_, runErr := c.InjectRun(ctx, InjectRunRequest{
			AgentID:        agentID,
			SessionKey:     sessionKey,
			Message:        message,
			TimeoutSeconds: req.TimeoutSeconds,
			Metadata:       metadata,
		})
		if runErr == nil {
			return nil
		}
		injectErr = runErr
	}

	hookErr := c.TriggerAgentHook(ctx, agentID, sessionKey, title, message)
	if hookErr == nil {
		return nil
	}
	return fmt.Errorf("inject notify failed: %v; hook fallback failed: %w", injectErr, hookErr)
}

// TriggerAgentHook sends an async webhook run to the AliveAgent gateway (`POST /hooks/agent`).
// This is best-effort and returns an error only when the request cannot be dispatched.
func (c *Client) TriggerAgentHook(ctx context.Context, agentID, sessionKey, name, message string) error {
	if !c.enabled {
		return nil
	}
	if strings.TrimSpace(c.baseURL) == "" {
		return fmt.Errorf("agent gateway base url is not configured")
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
		return fmt.Errorf("agent hook failed: status=%d", res.StatusCode)
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

// ChatCompletion calls the AliveAgent OpenAI-compatible endpoint (`POST /v1/chat/completions`)
// and returns the assistant's response text.
func (c *Client) ChatCompletion(ctx context.Context, agentID, sessionKey, userID, text string) (string, error) {
	if !c.enabled {
		return "", fmt.Errorf("agent gateway is disabled")
	}
	if strings.TrimSpace(c.baseURL) == "" {
		return "", fmt.Errorf("agent gateway base url is not configured")
	}
	if strings.TrimSpace(text) == "" {
		return "", fmt.Errorf("chat text is required")
	}

	model := "agent:main"
	if trimmedAgentID := strings.TrimSpace(agentID); trimmedAgentID != "" {
		model = "agent:" + trimmedAgentID
	}
	sessionUser := strings.TrimSpace(userID)
	if trimmedSessionKey := strings.TrimSpace(sessionKey); trimmedSessionKey != "" {
		// Align with AliveAgent docs: `user` is enough to derive stable session routing.
		sessionUser = trimmedSessionKey
	}

	payload := chatCompletionRequest{
		Model: model,
		Messages: []chatCompletionMessage{
			{Role: "user", Content: strings.TrimSpace(text)},
		},
		User: sessionUser,
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
		return "", fmt.Errorf("agent chat failed: status=%d body=%s", res.StatusCode, strings.TrimSpace(string(body)))
	}

	out := chatCompletionResponse{}
	if err := json.Unmarshal(body, &out); err != nil {
		return "", err
	}
	if len(out.Choices) == 0 {
		return "", fmt.Errorf("agent chat returned no choices")
	}
	content := out.Choices[0].Message.Content
	switch v := content.(type) {
	case string:
		return v, nil
	default:
		// Some OpenAI-compatible APIs can return structured content; fall back to JSON.
		rawContent, err := json.Marshal(v)
		if err != nil {
			return "", fmt.Errorf("agent chat returned unsupported content type")
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
}

func (c *Client) postGatewayJSON(ctx context.Context, path string, payload any) (status int, body []byte, err error) {
	if strings.TrimSpace(c.baseURL) == "" {
		return 0, nil, fmt.Errorf("agent gateway base url is not configured")
	}

	raw, err := json.Marshal(payload)
	if err != nil {
		return 0, nil, err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		strings.TrimRight(c.baseURL, "/")+path,
		bytes.NewReader(raw),
	)
	if err != nil {
		return 0, nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	c.applyGatewayAuth(req)

	res, err := c.httpClient.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer res.Body.Close()

	body, readErr := io.ReadAll(res.Body)
	if readErr != nil {
		return res.StatusCode, nil, readErr
	}
	if res.StatusCode < 200 || res.StatusCode > 299 {
		return res.StatusCode, body, fmt.Errorf("status=%d", res.StatusCode)
	}
	return res.StatusCode, body, nil
}

func (c *Client) getGateway(ctx context.Context, path string) (status int, body []byte, err error) {
	if strings.TrimSpace(c.baseURL) == "" {
		return 0, nil, fmt.Errorf("agent gateway base url is not configured")
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		strings.TrimRight(c.baseURL, "/")+path,
		nil,
	)
	if err != nil {
		return 0, nil, err
	}
	c.applyGatewayAuth(req)

	res, err := c.httpClient.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer res.Body.Close()

	body, readErr := io.ReadAll(res.Body)
	if readErr != nil {
		return res.StatusCode, nil, readErr
	}
	if res.StatusCode < 200 || res.StatusCode > 299 {
		return res.StatusCode, body, fmt.Errorf("status=%d", res.StatusCode)
	}
	return res.StatusCode, body, nil
}
