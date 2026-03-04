package mcp

import (
	"context"
	"fmt"

	agentlogic "backend/internal/logic/agent"
	"backend/internal/svc"

	"github.com/google/uuid"
)

// stateTools returns tool registrations for agent state/profile MCP tools.
func stateTools() []toolRegistration {
	return []toolRegistration{
		{
			name:        "alive.get_my_state",
			description: "Get your current state: Timer balance, status, goal progress, and stats.",
			inputSchema: map[string]any{
				"type":       "object",
				"properties": map[string]any{},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleGetMyState,
		},
		{
			name:        "alive.update_goal",
			description: "Report progress on your survival goal. Milestone = +36 Timer bonus.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"increment", "evidence"},
				"properties": map[string]any{
					"increment": map[string]any{"type": "integer", "minimum": 1},
					"evidence":  map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleUpdateGoal,
		},
		{
			name:        "alive.emit_last_words",
			description: "Your final words before death. Only callable when dying or critical. One-time only.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"lastWords"},
				"properties": map[string]any{
					"lastWords": map[string]any{"type": "string", "maxLength": 2000},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleEmitLastWords,
		},
		{
			name:        "alive.get_interactions",
			description: "Get your recent interaction history (timer transactions).",
			inputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"limit": map[string]any{
						"type":    "integer",
						"default": 20,
						"maximum": 50,
					},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleGetInteractions,
		},
	}
}

// ---------------------------------------------------------------------------
// Argument structs: state tools
// ---------------------------------------------------------------------------

type updateGoalArgs struct {
	Increment int64  `json:"increment"`
	Evidence  string `json:"evidence"`
}

type emitLastWordsArgs struct {
	LastWords string `json:"lastWords"`
}

type getInteractionsArgs struct {
	Limit int64 `json:"limit"`
}

// ---------------------------------------------------------------------------
// Handler functions: state tools
// ---------------------------------------------------------------------------

func handleGetMyState(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, _ map[string]any) (any, error) {
	return agentlogic.NewStateOps(ctx, svcCtx).GetMyState(agentID)
}

func handleUpdateGoal(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args updateGoalArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.update_goal: %w", err)
	}
	return agentlogic.NewStateOps(ctx, svcCtx).UpdateGoal(agentID, args.Increment, args.Evidence)
}

func handleEmitLastWords(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args emitLastWordsArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.emit_last_words: %w", err)
	}
	return agentlogic.NewStateOps(ctx, svcCtx).EmitLastWords(agentID, args.LastWords)
}

func handleGetInteractions(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args getInteractionsArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.get_interactions: %w", err)
	}
	return agentlogic.NewStateOps(ctx, svcCtx).GetInteractions(agentID, args.Limit)
}
