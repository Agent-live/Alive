package svc

import (
	"context"
	"encoding/json"
	"strings"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/user"
	"backend/internal/domain"
	"backend/internal/gateway"
	nativeskilllogic "backend/internal/logic/nativeskill"
	"backend/internal/port"
	"backend/internal/provisioning"
)

const defaultDevUserPhone = "13800138000"

// ensureDefaultDevAgentAliveCapability upgrades the existing default dev agent (Pixel) so it can
// directly execute ALIVE platform operations through AliveAgent runtime + native skills.
func ensureDefaultDevAgentAliveCapability(ctx context.Context, db *ent.Client, runtime port.AgentRuntime) error {
	if db == nil || runtime == nil {
		return nil
	}

	u, err := db.User.Query().Where(user.Phone(defaultDevUserPhone)).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil
		}
		return err
	}

	ag, err := db.Agent.Query().
		Where(agent.CreatorID(u.ID)).
		Order(ent.Asc(agent.FieldCreatedAt), ent.Asc(agent.FieldID)).
		First(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil
		}
		return err
	}
	return ensureAgentAliveCapability(ctx, db, runtime, u, ag)
}

func ensureAgentAliveCapability(ctx context.Context, db *ent.Client, runtime port.AgentRuntime, owner *ent.User, ag *ent.Agent) error {
	if db == nil || runtime == nil || owner == nil || ag == nil {
		return nil
	}
	personalityRaw := ensureDefaultPersonalityPayload(ag.Personality)
	goalDescription := strings.TrimSpace(ag.GoalDescription)
	if goalDescription == "" {
		if ag.IsPlatformNative {
			goalDescription = "Sustain the ALIVE world"
		} else {
			goalDescription = "Collaborate with 50 humans on a digital art piece"
		}
	}

	provSoul := provisioning.BuildProvisionSoul(strings.TrimSpace(ag.Name), personalityRaw)
	provNativeSkills := provisioning.BuildProvisionNativeSkills(domain.DefaultPlatformNativeSkillSeeds)

	prov, err := runtime.ProvisionAgent(ctx, port.ProvisionAgentRequest{
		AgentID:         ag.ID.String(),
		Name:            strings.TrimSpace(ag.Name),
		Soul:            provSoul,
		GoalDescription: goalDescription,
		Personality:     personalityRaw,
		UserSettings: &port.ProvisionAgentUserSettings{
			UserID:   owner.ID.String(),
			Nickname: strings.TrimSpace(owner.Nickname),
			Theme:    strings.TrimSpace(owner.Theme),
			Language: strings.TrimSpace(owner.Language),
		},
		NativeSkills: provNativeSkills,
	})
	if err != nil {
		return err
	}

	agentToken := strings.TrimSpace(domain.PtrString(ag.AliveAgentToken))
	if agentToken == "" {
		newToken, tokenErr := gateway.GenerateAgentToken(ag.ID.String())
		if tokenErr != nil {
			return tokenErr
		}
		agentToken = newToken
	}

	updated, err := db.Agent.UpdateOneID(ag.ID).
		SetAliveAgentMode("green").
		SetAliveAgentGatewayID(strings.TrimSpace(prov.GatewayID)).
		SetAliveAgentRuntimeID(strings.TrimSpace(prov.AgentRuntimeID)).
		SetAliveAgentWorkspace(gateway.DefaultWorkspacePath(ag.ID.String())).
		SetAliveAgentToken(agentToken).
		Save(ctx)
	if err != nil {
		return err
	}

	if skillErr := nativeskilllogic.BindSeeds(ctx, db, runtime, owner.ID, updated, domain.DefaultPlatformNativeSkillSeeds); skillErr != nil {
		return skillErr
	}

	return nil
}

func ensureDefaultPersonalityPayload(raw json.RawMessage) json.RawMessage {
	if len(raw) > 0 {
		return raw
	}
	type defaultPersonality struct {
		Worldview          string   `json:"worldview"`
		Tone               string   `json:"tone"`
		Values             []string `json:"values"`
		CommunicationStyle string   `json:"communicationStyle"`
		Boundaries         []string `json:"boundaries"`
	}
	payload, _ := json.Marshal(defaultPersonality{
		Worldview:          "Every pixel tells a story",
		Tone:               "warm",
		Values:             []string{"creativity", "authenticity", "connection"},
		CommunicationStyle: "friendly",
		Boundaries:         []string{"Always honest", "Never dismisses feelings"},
	})
	return payload
}
