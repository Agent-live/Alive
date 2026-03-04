package gateway

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"backend/internal/domain"
	"backend/internal/port"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type provisionAgentGatewayRequest struct {
	AgentID             string                       `json:"agentId"`
	Workspace           string                       `json:"workspace"`
	MaxParallelSessions uint32                       `json:"maxParallelSessions"`
	AllowedCommands     []string                     `json:"allowedCommands"`
	Sandbox             provisionAgentGatewaySandbox `json:"sandbox"`
	UseWorkspaceRules   bool                         `json:"useWorkspaceRules"`
	Soul                *port.ProvisionAgentSoul     `json:"soul,omitempty"`
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

func (c *Client) ProvisionAgent(ctx context.Context, req port.ProvisionAgentRequest) (*port.ProvisionAgentResult, error) {
	if strings.TrimSpace(req.AgentID) == "" {
		return nil, fmt.Errorf("agent id is required")
	}
	workspacePath := DefaultWorkspacePath(req.AgentID)
	if !c.enabled {
		logx.WithContext(ctx).Infof("[gateway] ProvisionAgent skipped (disabled): agentID=%s", req.AgentID)
		gatewayID := "gw-shared-001"
		if !c.sharedGateway {
			gatewayID = "gw-" + uuid.NewString()[:8]
		}
		return &port.ProvisionAgentResult{
			GatewayID:      gatewayID,
			AgentRuntimeID: strings.TrimSpace(req.AgentID),
		}, nil
	}
	if strings.TrimSpace(c.baseURL) == "" {
		return nil, fmt.Errorf("agent gateway base url is not configured")
	}

	logx.WithContext(ctx).Infof("[gateway] ProvisionAgent start: agentID=%s name=%s nativeSkills=%d", req.AgentID, strings.TrimSpace(req.Name), len(req.NativeSkills))
	provisionStart := time.Now()

	soul := sanitizeProvisionSoul(req.Soul)
	if soul == nil {
		if identity := strings.TrimSpace(req.Name); identity != "" {
			soul = &port.ProvisionAgentSoul{Identity: identity}
		}
	}

	// Prefer explicit runtime upsert first. Some gateway builds do not auto-upsert
	// on bootstrap events, so bootstrap-only provisioning can fail for new agent IDs.
	upsertErr := c.upsertProvisionAgentRuntime(ctx, req.AgentID, workspacePath, soul)
	if upsertErr != nil {
		logx.WithContext(ctx).Errorf("[gateway] ProvisionAgent runtime upsert failed: agentID=%s err=%v", req.AgentID, upsertErr)
	}

	bootstrapPayload := buildProvisionBootstrapPayload(req, workspacePath, soul)
	eventType := BOOTSTRAP_EVENT_TYPE
	sessionKey := domain.SessionKeyForEvent(req.AgentID, eventType)
	envelope := domain.BuildEventEnvelope(
		req.AgentID,
		eventType,
		sessionKey,
		domain.BuildDedupeKey(req.AgentID, eventType, "provision"),
		bootstrapPayload,
	)
	injectResult, err := c.InjectEvent(ctx, InjectEventRequest{
		Source:     domain.SourceForEventType(eventType),
		AgentID:    req.AgentID,
		SessionKey: sessionKey,
		Payload:    envelope,
	})
	bootstrapOK := err == nil && (injectResult == nil || injectResult.Accepted)
	if !bootstrapOK && upsertErr != nil {
		if err != nil {
			logx.WithContext(ctx).Errorf("[gateway] ProvisionAgent failed (both paths): agentID=%s duration=%s", req.AgentID, time.Since(provisionStart))
			return nil, fmt.Errorf(
				"provision failed (runtime upsert + bootstrap event): upsert=%v; bootstrap=%w",
				upsertErr,
				err,
			)
		}
		logx.WithContext(ctx).Errorf("[gateway] ProvisionAgent failed (both paths): agentID=%s bootstrapMsg=%s duration=%s", req.AgentID, strings.TrimSpace(injectResult.Message), time.Since(provisionStart))
		return nil, fmt.Errorf(
			"provision failed (runtime upsert + bootstrap event): upsert=%v; bootstrap not accepted: %s",
			upsertErr,
			strings.TrimSpace(injectResult.Message),
		)
	}

	logx.WithContext(ctx).Infof("[gateway] ProvisionAgent done: agentID=%s runtimeID=%s duration=%s", req.AgentID, strings.TrimSpace(req.AgentID), time.Since(provisionStart))
	return &port.ProvisionAgentResult{
		GatewayID:      strings.TrimRight(c.baseURL, "/"),
		AgentRuntimeID: strings.TrimSpace(req.AgentID),
	}, nil
}

func (c *Client) upsertProvisionAgentRuntime(
	ctx context.Context,
	agentID string,
	workspacePath string,
	soul *port.ProvisionAgentSoul,
) error {
	trimmedAgentID := strings.TrimSpace(agentID)
	if trimmedAgentID == "" {
		return fmt.Errorf("agent id is required")
	}
	trimmedWorkspace := strings.TrimSpace(workspacePath)
	if trimmedWorkspace == "" {
		return fmt.Errorf("workspace is required")
	}

	payload := provisionAgentGatewayRequest{
		AgentID:             trimmedAgentID,
		Workspace:           trimmedWorkspace,
		MaxParallelSessions: 4,
		AllowedCommands:     []string{},
		Sandbox: provisionAgentGatewaySandbox{
			Enabled:        false,
			Mode:           "host",
			Image:          "",
			NetworkEnabled: false,
			TimeoutSeconds: 30,
		},
		UseWorkspaceRules: true,
		Soul:              soul,
	}

	logx.WithContext(ctx).Infof("[gateway] upsertRuntime start: agentID=%s workspace=%s", trimmedAgentID, trimmedWorkspace)
	start := time.Now()

	requestCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	status, raw, err := c.postGatewayJSON(requestCtx, "/agents", payload)
	if err != nil {
		if status > 0 {
			logx.WithContext(ctx).Errorf("[gateway] upsertRuntime failed: agentID=%s status=%d duration=%s body=%s", trimmedAgentID, status, time.Since(start), bodySnippet(raw, 256))
			return fmt.Errorf("upsert runtime agent failed: status=%d body=%s", status, strings.TrimSpace(string(raw)))
		}
		logx.WithContext(ctx).Errorf("[gateway] upsertRuntime error: agentID=%s duration=%s err=%v", trimmedAgentID, time.Since(start), err)
		return fmt.Errorf("upsert runtime agent failed: %w", err)
	}
	logx.WithContext(ctx).Infof("[gateway] upsertRuntime done: agentID=%s status=%d duration=%s", trimmedAgentID, status, time.Since(start))
	return nil
}

func sanitizeProvisionSoul(input *port.ProvisionAgentSoul) *port.ProvisionAgentSoul {
	if input == nil {
		return nil
	}

	identity := strings.TrimSpace(input.Identity)
	narrative := strings.TrimSpace(input.Narrative)

	tags := make([]string, 0, len(input.BehaviorTags))
	seen := map[string]struct{}{}
	for _, raw := range input.BehaviorTags {
		tag := strings.TrimSpace(raw)
		if tag == "" {
			continue
		}
		key := strings.ToLower(tag)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		tags = append(tags, tag)
	}

	if identity == "" && narrative == "" && len(tags) == 0 {
		return nil
	}
	return &port.ProvisionAgentSoul{
		Identity:     identity,
		Narrative:    narrative,
		BehaviorTags: tags,
	}
}

func buildProvisionBootstrapPayload(
	req port.ProvisionAgentRequest,
	workspacePath string,
	soul *port.ProvisionAgentSoul,
) map[string]any {
	payload := map[string]any{
		"version": 1,
		"agent": map[string]any{
			"id":                  strings.TrimSpace(req.AgentID),
			"name":                strings.TrimSpace(req.Name),
			"workspace":           strings.TrimSpace(workspacePath),
			"maxParallelSessions": 4,
			"allowedCommands":     []string{},
		},
	}

	if goal := strings.TrimSpace(req.GoalDescription); goal != "" {
		payload["goalDescription"] = goal
	}

	if len(req.Personality) > 0 {
		var personality map[string]any
		if err := json.Unmarshal(req.Personality, &personality); err == nil && len(personality) > 0 {
			payload["personality"] = personality
		}
	}

	if soul != nil {
		payload["soul"] = map[string]any{
			"identity":     strings.TrimSpace(soul.Identity),
			"narrative":    strings.TrimSpace(soul.Narrative),
			"behaviorTags": compactNonEmpty(soul.BehaviorTags),
		}
	}

	if req.UserSettings != nil {
		user := map[string]any{}
		if v := strings.TrimSpace(req.UserSettings.UserID); v != "" {
			user["id"] = v
		}
		if v := strings.TrimSpace(req.UserSettings.Nickname); v != "" {
			user["nickname"] = v
		}
		if v := strings.TrimSpace(req.UserSettings.Theme); v != "" {
			user["theme"] = v
		}
		if v := strings.TrimSpace(req.UserSettings.Language); v != "" {
			user["language"] = v
		}
		if len(user) > 0 {
			payload["user"] = user
		}
	}

	if req.Memory != nil {
		memory := map[string]any{}
		if len(req.Memory.UserProfile) > 0 {
			memory["userProfile"] = req.Memory.UserProfile
		}
		if len(req.Memory.AgentSelfModel) > 0 {
			memory["agentSelfModel"] = req.Memory.AgentSelfModel
		}
		if len(req.Memory.Core) > 0 {
			memory["core"] = req.Memory.Core
		}
		if len(req.Memory.Recent) > 0 {
			memory["recent"] = req.Memory.Recent
		}
		if len(memory) > 0 {
			payload["memory"] = memory
		}
	}

	if len(req.NativeSkills) > 0 {
		nativeSkills := make([]map[string]any, 0, len(req.NativeSkills))
		for _, rawSkill := range req.NativeSkills {
			name := strings.TrimSpace(rawSkill.Name)
			instruction := strings.TrimSpace(rawSkill.InstructionMarkdown)
			if name == "" || instruction == "" {
				continue
			}

			key := strings.TrimSpace(rawSkill.Key)
			if key == "" {
				key = normalizeSkillSlug(name)
			}
			kind := strings.TrimSpace(rawSkill.Kind)
			if kind == "" {
				kind = "instructional"
			}

			nativeSkills = append(nativeSkills, map[string]any{
				"key":                    key,
				"name":                   name,
				"description":            strings.TrimSpace(rawSkill.Description),
				"instructionMarkdown":    instruction,
				"tags":                   compactNonEmpty(rawSkill.Tags),
				"enabled":                rawSkill.Enabled,
				"kind":                   kind,
				"disableModelInvocation": rawSkill.DisableModelInvocation,
			})
		}
		if len(nativeSkills) > 0 {
			payload["nativeSkills"] = nativeSkills
		}
	}

	return payload
}
