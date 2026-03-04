package gateway

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strings"
	"time"

	"backend/internal/port"

	"github.com/zeromicro/go-zero/core/logx"
)

const defaultWorkspaceRoot = "/data/agents"

// DefaultWorkspacePath returns the conventional workspace directory for an agent.
// This is used by callers that need to store or reference the workspace path
// without depending on the Client.
func DefaultWorkspacePath(agentID string) string {
	return defaultWorkspaceRoot + "/" + strings.TrimSpace(agentID)
}

type listAgentSkillsGatewayResponse struct {
	Count  int               `json:"count"`
	Skills []port.AgentSkill `json:"skills"`
}

// BindSkill registers a skill with the AliveAgent gateway via HTTP API.
func (c *Client) BindSkill(ctx context.Context, req port.BindSkillRequest) (*port.BindSkillResult, error) {
	if strings.TrimSpace(req.AgentID) == "" {
		return nil, fmt.Errorf("agent id is required")
	}
	if strings.TrimSpace(req.SkillName) == "" {
		return nil, fmt.Errorf("skill name is required")
	}
	slug := normalizeSkillSlug(req.SkillName)

	desc := strings.TrimSpace(req.Description)
	if desc == "" {
		desc = "ALIVE skill"
	}
	body := strings.TrimSpace(req.Instructions)
	if body == "" {
		return nil, fmt.Errorf("skill instructions are required")
	}

	agentID := strings.TrimSpace(req.AgentID)
	gatewayID := "gw-shared-001"

	if c.enabled {
		logx.WithContext(ctx).Infof("[gateway] BindSkill start: agentID=%s skill=%s slug=%s", agentID, strings.TrimSpace(req.SkillName), slug)
		bindStart := time.Now()

		payload := map[string]any{
			"agentId":             agentID,
			"key":                 slug,
			"name":                strings.TrimSpace(req.SkillName),
			"description":         desc,
			"instructionMarkdown": body,
			"enabled":             true,
			"kind":                "instructional",
		}

		requestCtx, cancel := context.WithTimeout(ctx, 6*time.Second)
		defer cancel()
		status, raw, err := c.postGatewayJSON(requestCtx, "/management/agents/"+agentID+"/skills", payload)
		if err != nil {
			if status > 0 {
				logx.WithContext(ctx).Errorf("[gateway] BindSkill failed: agentID=%s skill=%s status=%d duration=%s body=%s", agentID, slug, status, time.Since(bindStart), bodySnippet(raw, 256))
				return nil, fmt.Errorf("bind skill: status=%d body=%s", status, strings.TrimSpace(string(raw)))
			}
			logx.WithContext(ctx).Errorf("[gateway] BindSkill error: agentID=%s skill=%s duration=%s err=%v", agentID, slug, time.Since(bindStart), err)
			return nil, fmt.Errorf("bind skill: %w", err)
		}

		logx.WithContext(ctx).Infof("[gateway] BindSkill done: agentID=%s skill=%s duration=%s", agentID, slug, time.Since(bindStart))
		gatewayID = strings.TrimRight(c.baseURL, "/")
	}

	return &port.BindSkillResult{
		GatewayID: gatewayID,
		SkillID:   slug,
	}, nil
}

// RemoveSkill removes a skill from the AliveAgent gateway via HTTP API.
// This is best-effort; callers typically proceed even if the skill is already missing.
func (c *Client) RemoveSkill(ctx context.Context, agentID, skillRef string) error {
	agentID = strings.TrimSpace(agentID)
	if agentID == "" {
		return fmt.Errorf("agent id is required")
	}
	skillRef = strings.TrimSpace(skillRef)
	if skillRef == "" {
		return fmt.Errorf("skill ref is required")
	}
	slug := normalizeSkillSlug(skillRef)

	if !c.enabled {
		return nil
	}

	logx.WithContext(ctx).Infof("[gateway] RemoveSkill start: agentID=%s skill=%s", agentID, slug)
	removeStart := time.Now()

	requestCtx, cancel := context.WithTimeout(ctx, 4*time.Second)
	defer cancel()
	_, raw, err := c.deleteGateway(requestCtx, "/management/agents/"+agentID+"/skills/"+slug)
	if err != nil {
		logx.WithContext(ctx).Errorf("[gateway] RemoveSkill failed: agentID=%s skill=%s duration=%s err=%v", agentID, slug, time.Since(removeStart), err)
		return fmt.Errorf("remove skill: %s: %w", strings.TrimSpace(string(raw)), err)
	}
	logx.WithContext(ctx).Infof("[gateway] RemoveSkill done: agentID=%s skill=%s duration=%s", agentID, slug, time.Since(removeStart))
	return nil
}

// ListAgentSkills returns skills exposed by AliveAgent runtime for a specific agent.
func (c *Client) ListAgentSkills(ctx context.Context, agentID string, enabledOnly bool) ([]port.AgentSkill, error) {
	agentID = strings.TrimSpace(agentID)
	if agentID == "" {
		return nil, fmt.Errorf("agent id is required")
	}
	if !c.enabled {
		return []port.AgentSkill{}, nil
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
	logx.WithContext(ctx).Infof("[gateway] ListAgentSkills start: agentID=%s enabledOnly=%t", agentID, enabledOnly)
	listStart := time.Now()

	requestCtx, cancel := context.WithTimeout(ctx, 4*time.Second)
	defer cancel()
	status, raw, err := c.getGateway(requestCtx, path)
	if err != nil {
		if status > 0 {
			logx.WithContext(ctx).Errorf("[gateway] ListAgentSkills failed: agentID=%s status=%d duration=%s body=%s", agentID, status, time.Since(listStart), bodySnippet(raw, 256))
			return nil, fmt.Errorf("list skills failed: status=%d body=%s", status, strings.TrimSpace(string(raw)))
		}
		logx.WithContext(ctx).Errorf("[gateway] ListAgentSkills error: agentID=%s duration=%s err=%v", agentID, time.Since(listStart), err)
		return nil, err
	}

	resp := listAgentSkillsGatewayResponse{}
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &resp); err != nil {
			return nil, fmt.Errorf("list skills decode failed: %w", err)
		}
	}
	logx.WithContext(ctx).Infof("[gateway] ListAgentSkills done: agentID=%s count=%d duration=%s", agentID, len(resp.Skills), time.Since(listStart))
	if len(resp.Skills) == 0 {
		return []port.AgentSkill{}, nil
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

// UnregisterAgent removes an agent from the AliveAgent runtime (agent death or retirement).
func (c *Client) UnregisterAgent(ctx context.Context, agentID string) error {
	agentID = strings.TrimSpace(agentID)
	if agentID == "" {
		return fmt.Errorf("agent id is required")
	}
	if !c.enabled {
		return nil
	}

	logx.WithContext(ctx).Infof("[gateway] UnregisterAgent start: agentID=%s", agentID)
	unregStart := time.Now()

	reqCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	_, raw, err := c.deleteGateway(reqCtx, "/management/agents/"+agentID)
	if err != nil {
		logx.WithContext(ctx).Errorf("[gateway] UnregisterAgent failed: agentID=%s duration=%s err=%v", agentID, time.Since(unregStart), err)
		return fmt.Errorf("delete agent: %s: %w", strings.TrimSpace(string(raw)), err)
	}
	logx.WithContext(ctx).Infof("[gateway] UnregisterAgent done: agentID=%s duration=%s", agentID, time.Since(unregStart))
	return nil
}

func compactNonEmpty(items []string) []string {
	out := make([]string, 0, len(items))
	seen := map[string]struct{}{}
	for _, item := range items {
		value := strings.TrimSpace(item)
		if value == "" {
			continue
		}
		key := strings.ToLower(value)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, value)
	}
	return out
}
