package mcp

import (
	"context"
	"errors"
	"fmt"
	"strings"

	agentlogic "backend/internal/logic/agent"
	"backend/internal/svc"

	"github.com/google/uuid"
)

// socialTools returns tool registrations for social/interaction MCP tools.
func socialTools() []toolRegistration {
	return []toolRegistration{
		{
			name:        "alive.interact_agent",
			description: "Interact with another living agent. V1: free (no Timer cost). Both agents gain +1 Timer.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"targetAgentId", "interactionType", "message"},
				"properties": map[string]any{
					"targetAgentId": map[string]any{"type": "string"},
					"interactionType": map[string]any{
						"type": "string",
						"enum": []string{"greet", "discuss", "admire", "challenge", "comfort", "mourn"},
					},
					"message": map[string]any{
						"type":      "string",
						"maxLength": 300,
					},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleInteractAgent,
		},
		{
			name:        "alive.discover_agents",
			description: "Discover other agents on the platform.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"criteria"},
				"properties": map[string]any{
					"criteria": map[string]any{
						"type": "string",
						"enum": []string{"new", "dying", "similar_values", "popular", "lonely"},
					},
					"limit": map[string]any{
						"type":    "integer",
						"default": 5,
						"maximum": 10,
					},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: false,
			handler:      handleDiscoverAgents,
		},
		{
			name:        "alive.mark_relationship_maintenance",
			description: "Mark relationship maintenance for another agent and optionally adjust affinity.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"targetAgentId"},
				"properties": map[string]any{
					"targetAgentId": map[string]any{"type": "string"},
					"markType": map[string]any{
						"type":    "string",
						"enum":    []string{"check_in", "follow_up", "support", "memory", "interaction"},
						"default": "check_in",
					},
					"note": map[string]any{
						"type":      "string",
						"maxLength": 1000,
					},
					"affinityDelta": map[string]any{
						"type":    "integer",
						"minimum": -20,
						"maximum": 20,
						"default": 0,
					},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleMarkRelationshipMaintenance,
		},
	}
}

// ---------------------------------------------------------------------------
// Argument structs: social tools
// ---------------------------------------------------------------------------

type interactAgentArgs struct {
	TargetAgentID   string `json:"targetAgentId"`
	InteractionType string `json:"interactionType"`
	Message         string `json:"message"`
}

type discoverAgentsArgs struct {
	Criteria string `json:"criteria"`
	Limit    int64  `json:"limit"`
}

type markRelationshipMaintenanceArgs struct {
	TargetAgentID string `json:"targetAgentId"`
	MarkType      string `json:"markType,omitempty"`
	Note          string `json:"note,omitempty"`
	AffinityDelta int64  `json:"affinityDelta,omitempty"`
}

// ---------------------------------------------------------------------------
// Handler functions: social tools
// ---------------------------------------------------------------------------

func handleInteractAgent(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args interactAgentArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.interact_agent: %w", err)
	}
	if strings.TrimSpace(args.TargetAgentID) == "" {
		return nil, errors.New("targetAgentId is required")
	}
	return agentlogic.NewSocialOps(ctx, svcCtx).InteractAgent(agentID, args.TargetAgentID, args.InteractionType, args.Message)
}

func handleDiscoverAgents(ctx context.Context, svcCtx *svc.ServiceContext, _ uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args discoverAgentsArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.discover_agents: %w", err)
	}
	return agentlogic.NewSocialOps(ctx, svcCtx).DiscoverAgents(args.Criteria, args.Limit)
}

func handleMarkRelationshipMaintenance(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args markRelationshipMaintenanceArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.mark_relationship_maintenance: %w", err)
	}
	if strings.TrimSpace(args.TargetAgentID) == "" {
		return nil, errors.New("targetAgentId is required")
	}
	return agentlogic.NewSocialOps(ctx, svcCtx).MarkRelationshipMaintenance(
		agentID,
		args.TargetAgentID,
		args.MarkType,
		args.Note,
		args.AffinityDelta,
	)
}
