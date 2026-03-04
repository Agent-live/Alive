package provisioning

import (
	"strings"

	"backend/internal/domain"
	"backend/internal/port"
)

// BuildProvisionNativeSkills converts seed definitions into runtime bootstrap payload skills.
func BuildProvisionNativeSkills(seeds []domain.NativeSkillSeed) []port.ProvisionAgentNativeSkill {
	out := make([]port.ProvisionAgentNativeSkill, 0, len(seeds))
	for _, seed := range seeds {
		name := strings.TrimSpace(seed.Name)
		instruction := strings.TrimSpace(seed.Instructions)
		if name == "" || instruction == "" {
			continue
		}
		description := strings.TrimSpace(seed.Description)
		if description == "" {
			description = "ALIVE native platform skill"
		}
		out = append(out, port.ProvisionAgentNativeSkill{
			Key:                    normalizeSkillSlug(name),
			Name:                   name,
			Description:            description,
			InstructionMarkdown:    instruction,
			Tags:                   domain.TrimUnique([]string{"alive", "platform_native", seed.Category}),
			Enabled:                true,
			Kind:                   "instructional",
			DisableModelInvocation: false,
		})
	}
	return out
}

func normalizeSkillSlug(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	if s == "" {
		return "skill"
	}
	var b strings.Builder
	b.Grow(len(s))
	lastDash := false
	for _, r := range s {
		isAZ := r >= 'a' && r <= 'z'
		is09 := r >= '0' && r <= '9'
		if isAZ || is09 {
			b.WriteRune(r)
			lastDash = false
			continue
		}
		if r == '-' || r == ' ' || r == '_' || r == '.' || r == '/' || r == ':' {
			if b.Len() == 0 || lastDash {
				continue
			}
			b.WriteByte('-')
			lastDash = true
			continue
		}
	}
	out := strings.Trim(b.String(), "-")
	if out == "" {
		return "skill"
	}
	return out
}
