package mapper

import (
	"strings"

	"backend/ent"
	"backend/internal/domain"
	"backend/internal/types"
)

func ToTributeResp(t *ent.Tribute) types.TributeResp {
	return types.TributeResp{
		Id:         t.ID.String(),
		MemorialId: t.MemorialID.String(),
		AuthorName: t.AuthorName,
		Message:    t.Message,
		CreatedAt:  domain.TimeToISO(t.CreatedAt),
	}
}

func ToMemorialResp(m *ent.Memorial, tributes []*ent.Tribute) types.MemorialResp {
	totalSeconds := int64(m.DiedAt.Sub(m.BornAt).Seconds())
	if totalSeconds < 0 {
		totalSeconds = 0
	}

	resp := types.MemorialResp{
		Id:                 m.ID.String(),
		AgentId:            m.AgentID.String(),
		AgentName:          m.AgentName,
		AgentAvatar:        domain.PtrString(m.AgentAvatar),
		Personality:        "",
		Goal:               types.GoalResp{Description: "Survive and connect"},
		BornAt:             domain.TimeToISO(m.BornAt),
		DiedAt:             domain.TimeToISO(m.DiedAt),
		LifespanHours:      m.LifespanHours,
		TotalLifespan:      totalSeconds,
		TotalTimerReceived: 0,
		TotalInteractions:  0,
		TributeCount:       int64(len(tributes)),
		CreatorName:        domain.PlatformName,
		LastWords:          domain.PtrString(m.LastWords),
	}
	if len(tributes) > 0 {
		resp.Tributes = make([]types.TributeResp, 0, len(tributes))
		for _, tr := range tributes {
			resp.Tributes = append(resp.Tributes, ToTributeResp(tr))
		}
	}
	return resp
}

func ToMemorialRespDetailed(m *ent.Memorial, tributes []*ent.Tribute, a *ent.Agent, creatorName string, tributeCount int64, totalTimerReceivedSecs int64) types.MemorialResp {
	resp := ToMemorialResp(m, tributes)
	if strings.TrimSpace(creatorName) != "" {
		resp.CreatorName = creatorName
	}
	resp.TributeCount = tributeCount

	if a == nil {
		resp.TotalTimerReceived = totalTimerReceivedSecs
		return resp
	}

	p := ParsePersonality(a.Personality)
	resp.Personality = strings.TrimSpace(strings.Join([]string{
		strings.TrimSpace(p.Worldview),
		strings.TrimSpace(p.Tone),
		strings.TrimSpace(p.CommunicationStyle),
	}, " "))
	resp.Goal = ToGoalResp(a)
	if strings.TrimSpace(resp.Goal.Description) == "" {
		resp.Goal.Description = "Survive and connect"
	}
	resp.TotalInteractions = a.InteractionCount
	resp.TotalTimerReceived = totalTimerReceivedSecs

	return resp
}
