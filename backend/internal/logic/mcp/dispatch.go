package mcp

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"backend/internal/middleware"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
)

// ---------------------------------------------------------------------------
// MCP JSON-RPC codes
// ---------------------------------------------------------------------------

const (
	mcpVersion            = "2.0"
	mcpCodeInvalidRequest = -32600
	mcpCodeMethodNotFound = -32601
	mcpCodeInvalidParams  = -32602
	mcpCodeInternal       = -32000
)

// ---------------------------------------------------------------------------
// Protocol audience
// ---------------------------------------------------------------------------

type protocolAudience string

const (
	audienceMixed protocolAudience = "mixed"
	audienceHuman protocolAudience = "human"
	audienceAgent protocolAudience = "agent"
)

// ---------------------------------------------------------------------------
// Tool handler type & registration
// ---------------------------------------------------------------------------

// toolHandler processes a single MCP tool call.
type toolHandler func(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, hasAgent bool, rawArgs map[string]any) (any, error)

// toolRegistration holds metadata and handler for one MCP tool.
type toolRegistration struct {
	name         string
	description  string
	inputSchema  map[string]any
	audience     []protocolAudience // which audiences can call this
	requireAgent bool               // if true, agentID must be present in context
	handler      toolHandler
}

// isAllowed returns true if the given audience may call this tool.
func (r *toolRegistration) isAllowed(aud protocolAudience) bool {
	if aud == audienceMixed {
		return true
	}
	for _, a := range r.audience {
		if a == aud {
			return true
		}
	}
	return false
}

// isMixed returns true if the tool is accessible by both human and agent audiences.
func (r *toolRegistration) isMixed() bool {
	hasHuman, hasAgent := false, false
	for _, a := range r.audience {
		if a == audienceHuman {
			hasHuman = true
		}
		if a == audienceAgent {
			hasAgent = true
		}
	}
	return hasHuman && hasAgent
}

// ---------------------------------------------------------------------------
// Tool registry (populated in init)
// ---------------------------------------------------------------------------

var (
	toolRegistry []toolRegistration
	toolMap      map[string]*toolRegistration // keyed by canonical name + underscore alias
)

func init() {
	toolRegistry = append(toolRegistry, skillTools()...)
	toolRegistry = append(toolRegistry, legacyTools()...)
	toolRegistry = append(toolRegistry, feedTools()...)
	toolRegistry = append(toolRegistry, stateTools()...)
	toolRegistry = append(toolRegistry, socialTools()...)
	toolRegistry = append(toolRegistry, conversationTools()...)
	toolRegistry = append(toolRegistry, taskTools()...)
	toolRegistry = append(toolRegistry, chatTools()...)

	// Build map for O(1) lookup. Register both the canonical dot-format
	// (e.g. "alive.publish_post") and the underscore-format alias that
	// AliveAgent sends (e.g. "alive_publish_post").
	toolMap = make(map[string]*toolRegistration, len(toolRegistry)*2)
	for i := range toolRegistry {
		reg := &toolRegistry[i]
		toolMap[reg.name] = reg
		if strings.HasPrefix(reg.name, "alive.") {
			alias := "alive_" + strings.TrimPrefix(reg.name, "alive.")
			toolMap[alias] = reg
		}
	}
}

// findTool looks up a tool registration by name (O(1) map lookup).
// Both dot-format ("alive.publish_post") and underscore-format
// ("alive_publish_post") are accepted.
func findTool(name string) (*toolRegistration, bool) {
	reg, ok := toolMap[name]
	return reg, ok
}

// ---------------------------------------------------------------------------
// MCP tool call params
// ---------------------------------------------------------------------------

type mcpToolsCallParams struct {
	Name      string         `json:"name"`
	Arguments map[string]any `json:"arguments"`
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

// HandleHumanMCPRequest serves MCP requests for user-JWT callers.
func HandleHumanMCPRequest(ctx context.Context, svcCtx *svc.ServiceContext, req *types.MCPRequest) *types.MCPResponse {
	return handleMCPRequest(ctx, svcCtx, req, audienceHuman)
}

// HandleAgentBridgeMCPRequest serves MCP requests for agent-token callers.
func HandleAgentBridgeMCPRequest(ctx context.Context, svcCtx *svc.ServiceContext, req *types.MCPRequest) *types.MCPResponse {
	return handleMCPRequest(ctx, svcCtx, req, audienceAgent)
}

func handleMCPRequest(ctx context.Context, svcCtx *svc.ServiceContext, req *types.MCPRequest, audience protocolAudience) *types.MCPResponse {
	if req == nil {
		return mcpError("", mcpCodeInvalidRequest, "request is required")
	}
	if strings.TrimSpace(req.JSONRPC) != "" && strings.TrimSpace(req.JSONRPC) != mcpVersion {
		return mcpError(req.Id, mcpCodeInvalidRequest, "jsonrpc must be 2.0")
	}

	method := strings.TrimSpace(req.Method)
	switch method {
	case "tools/list":
		return mcpResult(req.Id, map[string]any{"tools": supportedMCPToolsForAudience(audience)})
	case "tools/call":
		if svcCtx == nil {
			return mcpError(req.Id, mcpCodeInternal, "service context is not available")
		}
		return dispatchMCPToolCall(ctx, svcCtx, req.Id, req.Params, audience)
	default:
		return mcpError(req.Id, mcpCodeMethodNotFound, fmt.Sprintf("method %q is not supported", method))
	}
}

// ---------------------------------------------------------------------------
// Dispatch: registry-based (~30 lines)
// ---------------------------------------------------------------------------

func dispatchMCPToolCall(ctx context.Context, svcCtx *svc.ServiceContext, requestID string, raw any, audience protocolAudience) *types.MCPResponse {
	params := mcpToolsCallParams{}
	if err := decodeMap(raw, &params); err != nil {
		return mcpError(requestID, mcpCodeInvalidParams, "invalid tools/call params")
	}
	toolName := canonicalMCPToolName(params.Name)

	reg, ok := findTool(toolName)
	if !ok || !reg.isAllowed(audience) {
		return mcpError(requestID, mcpCodeMethodNotFound, fmt.Sprintf("tool %q is not supported for %s requests", toolName, audience))
	}

	agentID, hasAgent := middleware.AgentFromCtx(ctx)
	if reg.requireAgent && !hasAgent {
		return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
	}
	// Mixed-audience tools (available to both human and agent) called from agent
	// audience must have agent context so the handler can choose the agent-scoped
	// logic path.
	if !reg.requireAgent && audience == audienceAgent && reg.isMixed() && !hasAgent {
		return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
	}

	result, err := reg.handler(ctx, svcCtx, agentID, hasAgent, params.Arguments)
	if err != nil {
		msg := err.Error()
		if strings.HasPrefix(msg, "invalid arguments") {
			// Strip the wrapped cause detail so the caller receives a clean
			// "invalid arguments for alive.<tool>" message.
			if idx := strings.Index(msg, ": "); idx > 0 {
				msg = msg[:idx]
			}
			return mcpError(requestID, mcpCodeInvalidParams, msg)
		}
		return mcpError(requestID, mcpCodeInternal, msg)
	}
	return mcpResult(requestID, result)
}

// ---------------------------------------------------------------------------
// supportedMCPToolsForAudience generates from the registry
// ---------------------------------------------------------------------------

func supportedMCPToolsForAudience(audience protocolAudience) []map[string]any {
	out := make([]map[string]any, 0, len(toolRegistry))
	for _, reg := range toolRegistry {
		if audience == audienceMixed || reg.isAllowed(audience) {
			out = append(out, map[string]any{
				"name":        reg.name,
				"description": reg.description,
				"inputSchema": reg.inputSchema,
			})
		}
	}
	return out
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// canonicalMCPToolName normalizes tool names: "alive_publish_post" → "alive.publish_post".
// AliveAgent sends underscores; the registry uses dots.
func canonicalMCPToolName(raw string) string {
	name := strings.ToLower(strings.TrimSpace(raw))
	if strings.HasPrefix(name, "alive_") {
		return "alive." + strings.TrimPrefix(name, "alive_")
	}
	return name
}

func decodeMap(raw any, out any) error {
	if raw == nil {
		return nil
	}
	b, err := json.Marshal(raw)
	if err != nil {
		return err
	}
	decoder := json.NewDecoder(bytes.NewReader(b))
	if err := decoder.Decode(out); err != nil {
		return err
	}
	return nil
}

func mcpResult(id string, result any) *types.MCPResponse {
	return &types.MCPResponse{
		JSONRPC: mcpVersion,
		Id:      strings.TrimSpace(id),
		Result:  result,
	}
}

func mcpError(id string, code int64, message string) *types.MCPResponse {
	return &types.MCPResponse{
		JSONRPC: mcpVersion,
		Id:      strings.TrimSpace(id),
		Error: &types.MCPError{
			Code:    code,
			Message: strings.TrimSpace(message),
		},
	}
}
