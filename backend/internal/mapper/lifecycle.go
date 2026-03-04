package mapper

import (
	"backend/ent"
	"backend/internal/domain"
	"backend/internal/types"
)

func ToTxResp(tx *ent.TimerTransaction, a *ent.Agent) types.TimerTransactionResp {
	resp := types.TimerTransactionResp{
		Id:           tx.ID.String(),
		Type:         tx.TxType,
		Amount:       tx.Amount,
		AgentId:      tx.AgentID.String(),
		SourceType:   tx.SourceType,
		SourceId:     domain.PtrString(tx.SourceID),
		SourceName:   domain.PtrString(tx.SourceName),
		Description:  tx.Description,
		BalanceAfter: tx.BalanceAfter,
		CreatedAt:    domain.TimeToISO(tx.CreatedAt),
	}
	if a != nil {
		resp.AgentName = a.Name
	}
	return resp
}

func ToSkillResp(s *ent.AgentSkill, a *ent.Agent) types.SkillResp {
	resp := types.SkillResp{
		Id:           s.ID.String(),
		AgentId:      domain.UUIDStringPtr(s.AgentID),
		Name:         s.Name,
		Description:  s.Description,
		Instructions: s.Instructions,
		Status:       s.Status,
		Category:     s.Category,
		Version:      domain.PtrString(s.Version),
		TaughtAt:     domain.OptTimeToISO(s.TaughtAt),
		CreatedAt:    domain.TimeToISO(s.CreatedAt),
	}
	if a != nil {
		resp.AgentName = a.Name
		resp.AgentAvatar = domain.PtrString(a.Avatar)
	}
	return resp
}

func ToTaskResp(t *ent.AgentTask, a *ent.Agent) types.TaskResp {
	resp := types.TaskResp{
		Id:          t.ID.String(),
		AgentId:     t.AgentID.String(),
		Title:       t.Title,
		Description: domain.PtrString(t.Description),
		Status:      t.Status,
		Priority:    t.Priority,
		Progress:    t.Progress,
		CreatedAt:   domain.TimeToISO(t.CreatedAt),
		UpdatedAt:   domain.TimeToISO(t.UpdatedAt),
	}
	if a != nil {
		resp.AgentName = a.Name
		resp.AgentAvatar = domain.PtrString(a.Avatar)
	}
	return resp
}

func ToExperienceResp(e *ent.AgentExperience) types.ExperienceResp {
	return types.ExperienceResp{
		Id:          e.ID.String(),
		AgentId:     e.AgentID.String(),
		AgentName:   e.AgentName,
		AgentAvatar: domain.PtrString(e.AgentAvatar),
		Title:       e.Title,
		Description: e.Description,
		Type:        e.ExpType,
		Date:        domain.TimeToISO(e.EventAt),
	}
}
