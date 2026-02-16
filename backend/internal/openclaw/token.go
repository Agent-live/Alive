package openclaw

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
)

// GenerateAgentToken creates a unique API token for an agent.
// Format: alive_agent_{agentID prefix}_{random 32 hex chars}
func GenerateAgentToken(agentID string) (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate agent token: %w", err)
	}
	prefix := strings.ReplaceAll(agentID, "-", "")
	if len(prefix) > 8 {
		prefix = prefix[:8]
	}
	return fmt.Sprintf("alive_agent_%s_%s", prefix, hex.EncodeToString(b)), nil
}

// IsAgentToken checks whether a bearer token looks like an agent token.
func IsAgentToken(token string) bool {
	return strings.HasPrefix(token, "alive_agent_")
}
