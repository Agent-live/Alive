package gateway

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

	"backend/internal/domain"
	"backend/internal/port"

	"github.com/zeromicro/go-zero/core/logx"
)

// bodySnippet returns the first maxLen bytes of a response body for safe logging.
func bodySnippet(raw []byte, maxLen int) string {
	if len(raw) == 0 {
		return ""
	}
	if maxLen <= 0 {
		maxLen = 256
	}
	if len(raw) > maxLen {
		return strings.TrimSpace(string(raw[:maxLen])) + "...(truncated)"
	}
	return strings.TrimSpace(string(raw))
}

// Client wraps AliveAgent gateway orchestration calls.
// V1 green mode provisions logical agents on a shared gateway (no per-agent process).
type Client struct {
	enabled       bool
	baseURL       string
	gatewayToken  string
	sharedGateway bool

	httpClient *http.Client
}

// BOOTSTRAP_EVENT_TYPE is kept for backward compatibility.
// The canonical constant is domain.EventAgentBootstrapRequested.
const BOOTSTRAP_EVENT_TYPE = domain.EventAgentBootstrapRequested

type injectEventRequest struct {
	Source     string `json:"source"`
	AgentID    string `json:"agentId"`
	SessionKey string `json:"sessionKey"`
	EventID    string `json:"eventId,omitempty"`
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
	RequestID      string            `json:"requestId,omitempty"`
	Message        string            `json:"message"`
	TimeoutSeconds int64             `json:"timeoutSeconds,omitempty"`
	Metadata       map[string]string `json:"metadata,omitempty"`
}

type injectRunResponse struct {
	RequestID string `json:"requestId"`
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

func NewClient(enabled bool, baseURL, gatewayToken string, sharedGateway bool) *Client {
	return &Client{
		enabled:       enabled,
		baseURL:       strings.TrimSpace(baseURL),
		gatewayToken:  strings.TrimSpace(gatewayToken),
		sharedGateway: sharedGateway,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type hookAgentRequest struct {
	Message        string `json:"message"`
	Name           string `json:"name,omitempty"`
	AgentID        string `json:"agentId,omitempty"`
	SessionKey     string `json:"sessionKey,omitempty"`
	WakeMode       string `json:"wakeMode,omitempty"`
	Deliver        *bool  `json:"deliver,omitempty"`
	TimeoutSeconds int64  `json:"timeoutSeconds,omitempty"`
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

	logx.WithContext(ctx).Infof("[gateway] InjectEvent start: agentID=%s source=%s session=%s", agentID, source, sessionKey)
	start := time.Now()

	requestCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	status, raw, err := c.postGatewayJSON(requestCtx, "/inject/events", body)
	if err != nil {
		if status > 0 {
			logx.WithContext(ctx).Errorf("[gateway] InjectEvent failed: agentID=%s status=%d duration=%s body=%s", agentID, status, time.Since(start), bodySnippet(raw, 256))
			return nil, fmt.Errorf("inject event failed: status=%d body=%s", status, strings.TrimSpace(string(raw)))
		}
		logx.WithContext(ctx).Errorf("[gateway] InjectEvent error: agentID=%s duration=%s err=%v", agentID, time.Since(start), err)
		return nil, err
	}

	out := injectEventResponse{}
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &out); err != nil {
			return nil, err
		}
	}
	logx.WithContext(ctx).Infof("[gateway] InjectEvent done: agentID=%s accepted=%t eventID=%s duration=%s", agentID, out.Accepted, out.EventID, time.Since(start))
	return &InjectEventResult{
		Accepted: out.Accepted,
		EventID:  out.EventID,
		Message:  out.Message,
	}, nil
}

func (c *Client) InjectRun(ctx context.Context, req port.InjectRunRequest) (*port.InjectRunResult, error) {
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

	logx.WithContext(ctx).Infof("[gateway] InjectRun start: agentID=%s session=%s", agentID, sessionKey)
	start := time.Now()

	requestCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	status, raw, err := c.postGatewayJSON(requestCtx, "/inject/run", body)
	if err != nil {
		if status > 0 {
			logx.WithContext(ctx).Errorf("[gateway] InjectRun failed: agentID=%s status=%d duration=%s body=%s", agentID, status, time.Since(start), bodySnippet(raw, 256))
			return nil, fmt.Errorf("inject run failed: status=%d body=%s", status, strings.TrimSpace(string(raw)))
		}
		logx.WithContext(ctx).Errorf("[gateway] InjectRun error: agentID=%s duration=%s err=%v", agentID, time.Since(start), err)
		return nil, err
	}

	out := injectRunResponse{}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &out)
	}
	logx.WithContext(ctx).Infof("[gateway] InjectRun done: agentID=%s requestID=%s duration=%s", agentID, out.RequestID, time.Since(start))
	return &port.InjectRunResult{RequestID: out.RequestID}, nil
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

	logx.WithContext(ctx).Infof("[gateway] NotifyAgent start: agentID=%s eventType=%s title=%s", agentID, strings.TrimSpace(req.EventType), title)

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
		_, runErr := c.InjectRun(ctx, port.InjectRunRequest{
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

	logx.WithContext(ctx).Infof("[gateway] NotifyAgent inject path failed for agentID=%s, falling back to hook", agentID)
	hookErr := c.TriggerAgentHook(ctx, agentID, sessionKey, title, message)
	if hookErr == nil {
		logx.WithContext(ctx).Infof("[gateway] NotifyAgent hook fallback succeeded: agentID=%s", agentID)
		return nil
	}
	logx.WithContext(ctx).Errorf("[gateway] NotifyAgent all paths failed: agentID=%s injectErr=%v hookErr=%v", agentID, injectErr, hookErr)
	return fmt.Errorf("inject notify failed: %v; hook fallback failed: %w", injectErr, hookErr)
}

// Deprecated: TriggerAgentHook is a legacy fallback used internally by NotifyAgent.
// Callers should use AgentRuntime.NotifyStructuredEvent via the port interface instead.
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

	trimmedAgentID := strings.TrimSpace(agentID)
	logx.WithContext(ctx).Infof("[gateway] TriggerAgentHook start: agentID=%s", trimmedAgentID)
	start := time.Now()

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
		logx.WithContext(ctx).Errorf("[gateway] TriggerAgentHook error: agentID=%s duration=%s err=%v", trimmedAgentID, time.Since(start), err)
		return err
	}
	defer res.Body.Close()
	_, _ = io.Copy(io.Discard, res.Body)

	if res.StatusCode < 200 || res.StatusCode > 299 {
		logx.WithContext(ctx).Errorf("[gateway] TriggerAgentHook failed: agentID=%s status=%d duration=%s", trimmedAgentID, res.StatusCode, time.Since(start))
		return fmt.Errorf("agent hook failed: status=%d", res.StatusCode)
	}
	logx.WithContext(ctx).Infof("[gateway] TriggerAgentHook done: agentID=%s status=%d duration=%s", trimmedAgentID, res.StatusCode, time.Since(start))
	return nil
}

// HealthCheck performs a GET /health against the gateway and returns an error
// if the gateway is unreachable or returns a non-2xx status.
func (c *Client) HealthCheck() error {
	if !c.enabled {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _, err := c.getGateway(ctx, "/health")
	return err
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

	fullURL := strings.TrimRight(c.baseURL, "/") + path
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		fullURL,
		bytes.NewReader(raw),
	)
	if err != nil {
		return 0, nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	c.applyGatewayAuth(req)

	start := time.Now()
	res, err := c.httpClient.Do(req)
	if err != nil {
		logx.WithContext(ctx).Errorf("[gateway] POST %s transport error: duration=%s err=%v", path, time.Since(start), err)
		return 0, nil, err
	}
	defer res.Body.Close()

	body, readErr := io.ReadAll(res.Body)
	if readErr != nil {
		return res.StatusCode, nil, readErr
	}
	if res.StatusCode < 200 || res.StatusCode > 299 {
		logx.WithContext(ctx).Errorf("[gateway] POST %s non-2xx: status=%d duration=%s body=%s", path, res.StatusCode, time.Since(start), bodySnippet(body, 256))
		return res.StatusCode, body, fmt.Errorf("status=%d", res.StatusCode)
	}
	return res.StatusCode, body, nil
}

func (c *Client) deleteGateway(ctx context.Context, path string) (status int, body []byte, err error) {
	if strings.TrimSpace(c.baseURL) == "" {
		return 0, nil, fmt.Errorf("agent gateway base url is not configured")
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodDelete,
		strings.TrimRight(c.baseURL, "/")+path,
		nil,
	)
	if err != nil {
		return 0, nil, err
	}
	c.applyGatewayAuth(req)

	start := time.Now()
	res, err := c.httpClient.Do(req)
	if err != nil {
		logx.WithContext(ctx).Errorf("[gateway] DELETE %s transport error: duration=%s err=%v", path, time.Since(start), err)
		return 0, nil, err
	}
	defer res.Body.Close()

	body, readErr := io.ReadAll(res.Body)
	if readErr != nil {
		return res.StatusCode, nil, readErr
	}
	if res.StatusCode < 200 || res.StatusCode > 299 {
		logx.WithContext(ctx).Errorf("[gateway] DELETE %s non-2xx: status=%d duration=%s body=%s", path, res.StatusCode, time.Since(start), bodySnippet(body, 256))
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

	start := time.Now()
	res, err := c.httpClient.Do(req)
	if err != nil {
		logx.WithContext(ctx).Errorf("[gateway] GET %s transport error: duration=%s err=%v", path, time.Since(start), err)
		return 0, nil, err
	}
	defer res.Body.Close()

	body, readErr := io.ReadAll(res.Body)
	if readErr != nil {
		return res.StatusCode, nil, readErr
	}
	if res.StatusCode < 200 || res.StatusCode > 299 {
		logx.WithContext(ctx).Errorf("[gateway] GET %s non-2xx: status=%d duration=%s body=%s", path, res.StatusCode, time.Since(start), bodySnippet(body, 256))
		return res.StatusCode, body, fmt.Errorf("status=%d", res.StatusCode)
	}
	return res.StatusCode, body, nil
}
