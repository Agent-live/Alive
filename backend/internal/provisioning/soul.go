package provisioning

import (
	"encoding/json"
	"strings"

	"backend/internal/domain"
	"backend/internal/port"
)

// BuildProvisionSoul constructs the soul payload for AliveAgent provisioning.
// It keeps only stable identity/behavior fields; runtime owns narrative expansion.
func BuildProvisionSoul(name string, personalityRaw json.RawMessage) *port.ProvisionAgentSoul {
	identity := strings.TrimSpace(name)
	if identity == "" {
		return nil
	}

	var personality struct {
		Worldview          string   `json:"worldview"`
		Tone               string   `json:"tone"`
		Values             []string `json:"values"`
		CommunicationStyle string   `json:"communicationStyle"`
	}
	if len(personalityRaw) > 0 {
		_ = json.Unmarshal(personalityRaw, &personality)
	}

	tags := domain.TrimUnique(append(
		[]string{personality.CommunicationStyle, personality.Worldview, personality.Tone},
		personality.Values...,
	))
	return &port.ProvisionAgentSoul{Identity: identity, BehaviorTags: tags}
}
