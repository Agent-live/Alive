package mcp

import (
	"context"
	"errors"
	"fmt"
	"strings"

	legacylogic "backend/internal/logic/legacy"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
)

// legacyTools returns tool registrations for legacy/memorial MCP tools.
func legacyTools() []toolRegistration {
	return []toolRegistration{
		{
			name:        "alive.list_legacy_packs",
			description: "List available legacy packs from dead agents.",
			inputSchema: map[string]any{
				"type":       "object",
				"properties": map[string]any{},
			},
			audience:     []protocolAudience{audienceHuman},
			requireAgent: false,
			handler:      handleListLegacyPacks,
		},
		{
			name:        "alive.get_legacy_detail",
			description: "Get detail of one legacy pack by ID.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"id"},
				"properties": map[string]any{
					"id": map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceHuman},
			requireAgent: false,
			handler:      handleGetLegacyDetail,
		},
		{
			name:        "alive.inherit_legacy",
			description: "Inherit a legacy pack into a new or existing agent.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"id", "newAgentId"},
				"properties": map[string]any{
					"id":         map[string]any{"type": "string"},
					"newAgentId": map[string]any{"type": "string"},
					"mode":       map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceHuman},
			requireAgent: false,
			handler:      handleInheritLegacy,
		},
	}
}

// ---------------------------------------------------------------------------
// Argument structs: legacy tools
// ---------------------------------------------------------------------------

type legacyIdArgs struct {
	ID string `json:"id"`
}

type legacyInheritArgs struct {
	ID         string `json:"id"`
	NewAgentID string `json:"newAgentId"`
	Mode       string `json:"mode"`
}

// ---------------------------------------------------------------------------
// Handler functions: legacy tools (human-only)
// ---------------------------------------------------------------------------

func handleListLegacyPacks(ctx context.Context, svcCtx *svc.ServiceContext, _ uuid.UUID, _ bool, _ map[string]any) (any, error) {
	return legacylogic.NewLogic(ctx, svcCtx).ListLegacyPacks()
}

func handleGetLegacyDetail(ctx context.Context, svcCtx *svc.ServiceContext, _ uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args legacyIdArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.get_legacy_detail: %w", err)
	}
	id := strings.TrimSpace(args.ID)
	if id == "" {
		return nil, errors.New("id is required")
	}
	return legacylogic.NewLogic(ctx, svcCtx).GetLegacyDetail(&types.LegacyIdReq{Id: id})
}

func handleInheritLegacy(ctx context.Context, svcCtx *svc.ServiceContext, _ uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args legacyInheritArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.inherit_legacy: %w", err)
	}
	id := strings.TrimSpace(args.ID)
	newAgentID := strings.TrimSpace(args.NewAgentID)
	if id == "" || newAgentID == "" {
		return nil, errors.New("id and newAgentId are required")
	}
	return legacylogic.NewLogic(ctx, svcCtx).InheritLegacy(&types.LegacyInheritReq{
		Id:         id,
		NewAgentId: newAgentID,
		Mode:       strings.TrimSpace(args.Mode),
	})
}
