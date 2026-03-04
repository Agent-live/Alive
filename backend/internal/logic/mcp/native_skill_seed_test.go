package mcp

import (
	"strings"
	"testing"

	"backend/internal/domain"
)

func TestDefaultNativeSkillSeedsReferenceRegisteredAgentTools(t *testing.T) {
	if len(domain.DefaultPlatformNativeSkillSeeds) == 0 {
		t.Fatal("default native skill seeds must not be empty")
	}

	seenChatReply := false
	seenChatStream := false

	for _, seed := range domain.DefaultPlatformNativeSkillSeeds {
		seedName := strings.TrimSpace(seed.Name)
		if seedName == "" {
			t.Fatal("native skill seed name must not be empty")
		}

		instructions := strings.TrimSpace(seed.Instructions)
		if instructions == "" {
			t.Fatalf("native skill %q must include instructions", seedName)
		}

		toolRefs := parseToolRefsFromInstructions(instructions)
		if len(toolRefs) == 0 {
			t.Fatalf("native skill %q must reference at least one MCP tool", seedName)
		}

		for _, ref := range toolRefs {
			toolName := canonicalMCPToolName(ref)
			reg, ok := findTool(toolName)
			if !ok {
				t.Fatalf("native skill %q references unknown MCP tool %q", seedName, toolName)
			}
			if !reg.isAllowed(audienceAgent) {
				t.Fatalf("native skill %q references non-agent tool %q", seedName, toolName)
			}
			if strings.TrimSpace(reg.description) == "" {
				t.Fatalf("native skill %q references tool %q with empty description", seedName, toolName)
			}
			if reg.inputSchema == nil || len(reg.inputSchema) == 0 {
				t.Fatalf("native skill %q references tool %q with empty input schema", seedName, toolName)
			}
			if toolName == "alive.reply_to_chat" {
				seenChatReply = true
			}
			if toolName == "alive.stream_chat_token" {
				seenChatStream = true
			}
		}
	}

	if !seenChatReply || !seenChatStream {
		t.Fatalf("default native skills must include chat bridge tools; seen reply=%t stream=%t", seenChatReply, seenChatStream)
	}
}

func parseToolRefsFromInstructions(instructions string) []string {
	refs := make([]string, 0, 16)
	seen := map[string]struct{}{}
	for _, raw := range strings.Split(instructions, "\n") {
		line := strings.TrimSpace(raw)
		if !strings.HasPrefix(line, "- alive.") && !strings.HasPrefix(line, "- alive_") {
			continue
		}

		line = strings.TrimSpace(strings.TrimPrefix(line, "-"))
		if line == "" {
			continue
		}

		if i := strings.IndexAny(line, " \t:"); i >= 0 {
			line = line[:i]
		}
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if _, ok := seen[line]; ok {
			continue
		}
		seen[line] = struct{}{}
		refs = append(refs, line)
	}
	return refs
}
