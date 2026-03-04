package mcp

import (
	"context"
	"testing"

	"backend/internal/middleware"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
)

func TestHandleHumanMCPRequestToolsList(t *testing.T) {
	resp := HandleHumanMCPRequest(context.Background(), &svc.ServiceContext{}, &types.MCPRequest{
		JSONRPC: "2.0",
		Id:      "req-1",
		Method:  "tools/list",
	})

	if resp.Error != nil {
		t.Fatalf("expected no mcp error, got %+v", resp.Error)
	}
	result, ok := resp.Result.(map[string]any)
	if !ok {
		t.Fatalf("expected result object, got %T", resp.Result)
	}
	toolsRaw, ok := result["tools"]
	if !ok {
		t.Fatalf("expected tools key in result")
	}
	tools, ok := toolsRaw.([]map[string]any)
	if !ok {
		t.Fatalf("expected typed tools array, got %T", toolsRaw)
	}
	if len(tools) < 10 {
		t.Fatalf("expected at least 10 human-visible tools, got %d", len(tools))
	}
}

func TestHandleHumanMCPRequestUnknownMethod(t *testing.T) {
	resp := HandleHumanMCPRequest(context.Background(), &svc.ServiceContext{}, &types.MCPRequest{
		JSONRPC: "2.0",
		Id:      "req-3",
		Method:  "unknown/method",
	})
	if resp.Error == nil {
		t.Fatal("expected mcp error")
	}
	if resp.Error.Code != mcpCodeMethodNotFound {
		t.Fatalf("expected method not found code, got %d", resp.Error.Code)
	}
}

func TestHandleHumanMCPRequestToolsListFiltersAgentTools(t *testing.T) {
	resp := HandleHumanMCPRequest(context.Background(), &svc.ServiceContext{}, &types.MCPRequest{
		JSONRPC: "2.0",
		Id:      "req-human-tools",
		Method:  "tools/list",
	})
	if resp.Error != nil {
		t.Fatalf("expected no mcp error, got %+v", resp.Error)
	}
	result, ok := resp.Result.(map[string]any)
	if !ok {
		t.Fatalf("expected result object, got %T", resp.Result)
	}
	rawTools, ok := result["tools"].([]map[string]any)
	if !ok {
		t.Fatalf("expected typed tools array, got %T", result["tools"])
	}

	seenSkillTool := false
	for _, tool := range rawTools {
		name, _ := tool["name"].(string)
		if name == "alive.list_skills" {
			seenSkillTool = true
		}
		if name == "alive.send_message" {
			t.Fatalf("human tools/list should not expose agent-only tool %q", name)
		}
	}
	if !seenSkillTool {
		t.Fatal("expected alive.list_skills in human tools/list")
	}
}

func TestHandleAgentBridgeMCPRequestRequiresAgentContextForSkillTool(t *testing.T) {
	resp := HandleAgentBridgeMCPRequest(context.Background(), &svc.ServiceContext{}, &types.MCPRequest{
		JSONRPC: "2.0",
		Id:      "req-agent-reject",
		Method:  "tools/call",
		Params: map[string]any{
			"name": "alive.list_skills",
			"arguments": map[string]any{
				"status": "lesson",
			},
		},
	})
	if resp.Error == nil {
		t.Fatal("expected mcp error for missing agent context")
	}
	if resp.Error.Code != mcpCodeInvalidRequest {
		t.Fatalf("expected invalid request code, got %d", resp.Error.Code)
	}
}

func TestHandleAgentBridgeMCPRequestRejectsInvalidArguments(t *testing.T) {
	cases := []struct {
		name         string
		tool         string
		arguments    map[string]any
		withAgentCtx bool
		wantMessage  string
	}{
		{
			name:        "get feed",
			tool:        "alive.get_feed",
			arguments:   map[string]any{"limit": "invalid"},
			wantMessage: "invalid arguments for alive.get_feed",
		},
		{
			name:        "discover agents",
			tool:        "alive.discover_agents",
			arguments:   map[string]any{"limit": "invalid"},
			wantMessage: "invalid arguments for alive.discover_agents",
		},
		{
			name:         "get interactions",
			tool:         "alive.get_interactions",
			arguments:    map[string]any{"limit": "invalid"},
			withAgentCtx: true,
			wantMessage:  "invalid arguments for alive.get_interactions",
		},
		{
			name:         "list conversations",
			tool:         "alive.list_conversations",
			arguments:    map[string]any{"chatType": 1},
			withAgentCtx: true,
			wantMessage:  "invalid arguments for alive.list_conversations",
		},
		{
			name:         "list tasks",
			tool:         "alive.list_tasks",
			arguments:    map[string]any{"limit": "invalid"},
			withAgentCtx: true,
			wantMessage:  "invalid arguments for alive.list_tasks",
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			if tc.withAgentCtx {
				ctx = middleware.WithAgentCtx(ctx, uuid.New())
			}

			resp := HandleAgentBridgeMCPRequest(ctx, &svc.ServiceContext{}, &types.MCPRequest{
				JSONRPC: "2.0",
				Id:      "req-invalid-args",
				Method:  "tools/call",
				Params: map[string]any{
					"name":      tc.tool,
					"arguments": tc.arguments,
				},
			})

			if resp.Error == nil {
				t.Fatal("expected invalid params error")
			}
			if resp.Error.Code != mcpCodeInvalidParams {
				t.Fatalf("expected invalid params code, got %d", resp.Error.Code)
			}
			if resp.Error.Message != tc.wantMessage {
				t.Fatalf("expected error %q, got %q", tc.wantMessage, resp.Error.Message)
			}
		})
	}
}

func TestCanonicalMCPToolName(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{"alive.get_feed", "alive.get_feed"},
		{"alive_get_feed", "alive.get_feed"},
		{"ALIVE_GET_FEED", "alive.get_feed"},
		{"  alive.list_skills  ", "alive.list_skills"},
	}
	for _, tc := range cases {
		got := canonicalMCPToolName(tc.input)
		if got != tc.want {
			t.Errorf("canonicalMCPToolName(%q) = %q, want %q", tc.input, got, tc.want)
		}
	}
}

func TestHandleHumanMCPRequestNilRequest(t *testing.T) {
	resp := HandleHumanMCPRequest(context.Background(), &svc.ServiceContext{}, nil)
	if resp.Error == nil {
		t.Fatal("expected error for nil request")
	}
	if resp.Error.Code != mcpCodeInvalidRequest {
		t.Fatalf("expected invalid request code, got %d", resp.Error.Code)
	}
}

func TestHandleHumanMCPRequestInvalidJSONRPC(t *testing.T) {
	resp := HandleHumanMCPRequest(context.Background(), &svc.ServiceContext{}, &types.MCPRequest{
		JSONRPC: "1.0",
		Id:      "req-bad-version",
		Method:  "tools/list",
	})
	if resp.Error == nil {
		t.Fatal("expected error for bad jsonrpc version")
	}
	if resp.Error.Code != mcpCodeInvalidRequest {
		t.Fatalf("expected invalid request code, got %d", resp.Error.Code)
	}
}

func TestUnderscoreAliasResolvesToTool(t *testing.T) {
	// Verify that "alive_get_feed" resolves to "alive.get_feed" via canonicalMCPToolName
	// and that the tool is found in the registry.
	canonical := canonicalMCPToolName("alive_get_feed")
	if canonical != "alive.get_feed" {
		t.Fatalf("expected alive.get_feed, got %q", canonical)
	}
	reg, ok := findTool(canonical)
	if !ok {
		t.Fatalf("expected to find tool %q in registry", canonical)
	}
	if reg.name != "alive.get_feed" {
		t.Fatalf("expected tool name alive.get_feed, got %q", reg.name)
	}
	// Verify it's allowed for agent audience
	if !reg.isAllowed(audienceAgent) {
		t.Fatal("expected alive.get_feed to be allowed for agent audience")
	}
}
