package legacy

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/agentexperience"
	"backend/ent/agentrelationship"
	"backend/ent/agentskill"
	"backend/ent/agenttask"
	"backend/ent/memorial"
	"backend/ent/post"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/logic/notify"
	"backend/internal/mapper"
	"backend/internal/port"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type Logic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewLogic(ctx context.Context, svcCtx *svc.ServiceContext) *Logic {
	return &Logic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *Logic) ListLegacyPacks() (*types.LegacyListResp, error) {
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	packs, err := l.collectLegacyPacksForUser(u.ID)
	if err != nil {
		return nil, err
	}
	return &types.LegacyListResp{Items: packs}, nil
}

func (l *Logic) GetLegacyDetail(req *types.LegacyIdReq) (*types.LegacyPackResp, error) {
	if req == nil || strings.TrimSpace(req.Id) == "" {
		return nil, errors.New("legacy id is required")
	}
	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	packs, err := l.collectLegacyPacksForUser(u.ID)
	if err != nil {
		return nil, err
	}
	targetID := strings.TrimSpace(req.Id)
	for _, item := range packs {
		if item.Id == targetID {
			out := item
			return &out, nil
		}
	}
	return nil, errors.New("legacy pack not found")
}

func (l *Logic) InheritLegacy(req *types.LegacyInheritReq) (*types.LegacyInheritResp, error) {
	if req == nil {
		return nil, errors.New("request is required")
	}
	legacyID := strings.TrimSpace(req.Id)
	if legacyID == "" {
		return nil, errors.New("legacy id is required")
	}
	newAgentIDRaw := strings.TrimSpace(req.NewAgentId)
	if newAgentIDRaw == "" {
		return nil, errors.New("newAgentId is required")
	}
	newAgentID, err := uuid.Parse(newAgentIDRaw)
	if err != nil {
		return nil, errors.New("invalid newAgentId")
	}

	mode := strings.ToLower(strings.TrimSpace(req.Mode))
	if mode == "" {
		mode = "full"
	}
	if mode != "full" && mode != "selective" {
		return nil, errors.New("mode must be full or selective")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}
	memorialID, err := uuid.Parse(legacyID)
	if err != nil {
		return nil, errors.New("invalid legacy id")
	}

	memorialRow, err := l.svcCtx.DB.Memorial.Get(l.ctx, memorialID)
	if err != nil {
		return nil, errors.New("legacy pack not found")
	}
	sourceAgent, err := l.svcCtx.DB.Agent.Get(l.ctx, memorialRow.AgentID)
	if err != nil {
		return nil, err
	}
	if sourceAgent.CreatorID != u.ID {
		return nil, errors.New("forbidden")
	}
	targetAgent, err := l.svcCtx.DB.Agent.Get(l.ctx, newAgentID)
	if err != nil {
		return nil, err
	}
	if targetAgent.CreatorID != u.ID {
		return nil, errors.New("forbidden")
	}
	if strings.EqualFold(targetAgent.Status, domain.StatusDead) {
		return nil, errors.New("target agent must be alive")
	}

	sourceSkillRows, err := l.svcCtx.DB.AgentSkill.Query().
		Where(
			agentskill.OwnerUserID(u.ID),
			agentskill.AgentID(memorialRow.AgentID),
			agentskill.DeletedAtIsNil(),
		).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	sourceTaskRows, err := l.svcCtx.DB.AgentTask.Query().
		Where(
			agenttask.AgentID(memorialRow.AgentID),
			agenttask.DeletedAtIsNil(),
		).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	sourceRelationshipRows, err := l.svcCtx.DB.AgentRelationship.Query().
		Where(agentrelationship.AgentID(memorialRow.AgentID)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}

	l.notifyLegacyEvent(
		targetAgent,
		"legacy.inheritance_requested",
		"ALIVE Legacy Inheritance Requested",
		fmt.Sprintf("Inheritance requested from %s", memorialRow.AgentName),
		domain.BuildDedupeKey(targetAgent.ID.String(), "legacy.inheritance_requested", legacyID, targetAgent.ID.String()),
		map[string]any{
			"legacyId":      legacyID,
			"sourceAgentId": sourceAgent.ID.String(),
			"sourceAgent":   memorialRow.AgentName,
			"targetAgentId": targetAgent.ID.String(),
			"mode":          mode,
		},
	)
	l.notifyLegacyEvent(
		targetAgent,
		"legacy.inheritance_previewed",
		"ALIVE Legacy Inheritance Preview",
		"Inheritance preview generated",
		domain.BuildDedupeKey(targetAgent.ID.String(), "legacy.inheritance_previewed", legacyID, mode),
		map[string]any{
			"legacyId":           legacyID,
			"mode":               mode,
			"candidateSkills":    len(sourceSkillRows),
			"candidateTasks":     len(sourceTaskRows),
			"candidateRelations": len(sourceRelationshipRows),
		},
	)

	type createdSkill struct {
		ID           uuid.UUID
		Name         string
		Description  string
		Instructions string
	}
	createdSkills := make([]createdSkill, 0, len(sourceSkillRows))
	importedTaskCount := int64(0)
	importedRelationshipCount := int64(0)

	err = l.svcCtx.Time.WithTx(l.ctx, func(tx *ent.Tx, now time.Time) error {
		for _, src := range sourceSkillRows {
			exists, err := tx.AgentSkill.Query().
				Where(
					agentskill.OwnerUserID(u.ID),
					agentskill.AgentID(newAgentID),
					agentskill.Name(src.Name),
					agentskill.DeletedAtIsNil(),
				).
				Exist(l.ctx)
			if err != nil {
				return err
			}
			if exists {
				continue
			}

			builder := tx.AgentSkill.Create().
				SetOwnerUserID(u.ID).
				SetAgentID(newAgentID).
				SetName(src.Name).
				SetDescription(src.Description).
				SetInstructions(src.Instructions).
				SetCategory(src.Category).
				SetStatus(domain.SkillStatusActive).
				SetTaughtAt(now).
				SetSourceSkillID(src.ID)
			if src.Version != nil {
				builder.SetVersion(*src.Version)
			}
			row, err := builder.Save(l.ctx)
			if err != nil {
				return err
			}
			createdSkills = append(createdSkills, createdSkill{
				ID:           row.ID,
				Name:         row.Name,
				Description:  row.Description,
				Instructions: row.Instructions,
			})
		}

		if mode == "full" {
			for _, src := range sourceTaskRows {
				title := strings.TrimSpace(src.Title)
				if title == "" {
					continue
				}
				if !strings.HasPrefix(title, "[Legacy] ") {
					title = "[Legacy] " + title
				}
				create := tx.AgentTask.Create().
					SetAgentID(newAgentID).
					SetTitle(title).
					SetPriority(src.Priority).
					SetStatus("todo").
					SetProgress(0)
				if desc := strings.TrimSpace(domain.PtrString(src.Description)); desc != "" {
					create.SetDescription(desc)
				}
				if _, err := create.Save(l.ctx); err != nil {
					return err
				}
				importedTaskCount++
			}

			for _, src := range sourceRelationshipRows {
				if src.TargetAgentID == newAgentID {
					continue
				}
				exists, err := tx.AgentRelationship.Query().
					Where(
						agentrelationship.AgentID(newAgentID),
						agentrelationship.TargetAgentID(src.TargetAgentID),
					).
					Exist(l.ctx)
				if err != nil {
					return err
				}
				if exists {
					continue
				}

				label := src.Label
				if strings.TrimSpace(label) == "" {
					label = domain.RelationshipLabelAcquaintance
				}
				_, err = tx.AgentRelationship.Create().
					SetAgentID(newAgentID).
					SetTargetAgentID(src.TargetAgentID).
					SetAffinity(src.Affinity).
					SetLabel(label).
					SetInteractionCount(0).
					SetMessageCount(0).
					Save(l.ctx)
				if err != nil {
					return err
				}
				importedRelationshipCount++
			}
		}

		recordPayload, _ := json.Marshal(map[string]any{
			"legacyId":                  legacyID,
			"sourceAgentId":             sourceAgent.ID.String(),
			"newAgentId":                newAgentID.String(),
			"mode":                      mode,
			"importedSkillCount":        len(createdSkills),
			"importedTaskCount":         importedTaskCount,
			"importedRelationshipCount": importedRelationshipCount,
		})

		_, _ = tx.AgentExperience.Create().
			SetOwnerUserID(u.ID).
			SetAgentID(newAgentID).
			SetAgentName(targetAgent.Name).
			SetNillableAgentAvatar(targetAgent.Avatar).
			SetExpType("legacy_inheritance").
			SetTitle("Legacy inheritance applied").
			SetDescription(string(recordPayload)).
			SetEventAt(now).
			Save(l.ctx)

		return nil
	})
	if err != nil {
		l.notifyLegacyEvent(
			targetAgent,
			"legacy.inheritance_rejected",
			"ALIVE Legacy Inheritance Failed",
			"Inheritance application failed",
			domain.BuildDedupeKey(targetAgent.ID.String(), "legacy.inheritance_rejected", legacyID, targetAgent.ID.String()),
			map[string]any{
				"legacyId":      legacyID,
				"targetAgentId": targetAgent.ID.String(),
				"reason":        err.Error(),
			},
		)
		return nil, err
	}

	// Bind imported skills into AliveAgent runtime (best-effort post-commit).
	boundSkillCount := int64(0)
	runtimeAgentID := strings.TrimSpace(domain.PtrString(targetAgent.AliveAgentRuntimeID))
	for _, item := range createdSkills {
		if runtimeAgentID == "" || l.svcCtx.AgentRuntime == nil {
			continue
		}
		binding, bindErr := l.svcCtx.AgentRuntime.BindSkill(l.ctx, port.BindSkillRequest{
			AgentID:      targetAgent.ID.String(),
			SkillName:    item.Name,
			Description:  item.Description,
			Instructions: item.Instructions,
		})
		if bindErr != nil {
			l.Logger.Errorf("bind inherited skill failed skill_id=%s err=%v", item.ID.String(), bindErr)
			continue
		}
		_, _ = l.svcCtx.DB.AgentSkill.UpdateOneID(item.ID).
			SetAliveAgentGatewayID(binding.GatewayID).
			SetAliveAgentSkillID(binding.SkillID).
			Save(l.ctx)
		boundSkillCount++
	}

	l.notifyLegacyEvent(
		targetAgent,
		"legacy.asset_imported",
		"ALIVE Legacy Assets Imported",
		"Legacy assets imported",
		domain.BuildDedupeKey(targetAgent.ID.String(), "legacy.asset_imported", legacyID, targetAgent.ID.String()),
		map[string]any{
			"legacyId":                  legacyID,
			"targetAgentId":             targetAgent.ID.String(),
			"importedSkillCount":        len(createdSkills),
			"boundSkillCount":           boundSkillCount,
			"importedTaskCount":         importedTaskCount,
			"importedRelationshipCount": importedRelationshipCount,
			"mode":                      mode,
		},
	)
	l.notifyLegacyEvent(
		targetAgent,
		"legacy.inheritance_applied",
		"ALIVE Legacy Inheritance Applied",
		fmt.Sprintf("Legacy inheritance applied from %s", memorialRow.AgentName),
		domain.BuildDedupeKey(targetAgent.ID.String(), "legacy.inheritance_applied", legacyID, targetAgent.ID.String()),
		map[string]any{
			"legacyId":                  legacyID,
			"sourceAgentId":             sourceAgent.ID.String(),
			"targetAgentId":             targetAgent.ID.String(),
			"importedSkillCount":        len(createdSkills),
			"boundSkillCount":           boundSkillCount,
			"importedTaskCount":         importedTaskCount,
			"importedRelationshipCount": importedRelationshipCount,
			"mode":                      mode,
		},
	)

	return &types.LegacyInheritResp{
		Success:                   true,
		LegacyId:                  legacyID,
		NewAgentId:                targetAgent.ID.String(),
		ImportedSkillCount:        int64(len(createdSkills)),
		ImportedTaskCount:         importedTaskCount,
		ImportedRelationshipCount: importedRelationshipCount,
	}, nil
}

func (l *Logic) collectLegacyPacksForUser(userID uuid.UUID) ([]types.LegacyPackResp, error) {
	deadAgents, err := l.svcCtx.DB.Agent.Query().
		Where(agent.CreatorID(userID), agent.Status(domain.StatusDead)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	if len(deadAgents) == 0 {
		return []types.LegacyPackResp{}, nil
	}

	agentIDs := make([]uuid.UUID, 0, len(deadAgents))
	agentMap := make(map[uuid.UUID]*ent.Agent, len(deadAgents))
	for _, item := range deadAgents {
		agentIDs = append(agentIDs, item.ID)
		agentMap[item.ID] = item
	}

	memorialRows, err := l.svcCtx.DB.Memorial.Query().
		Where(memorial.AgentIDIn(agentIDs...)).
		Order(ent.Desc(memorial.FieldDiedAt)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	if len(memorialRows) == 0 {
		return []types.LegacyPackResp{}, nil
	}

	inheritMap, err := l.loadInheritanceMap(userID)
	if err != nil {
		return nil, err
	}

	out := make([]types.LegacyPackResp, 0, len(memorialRows))
	for _, m := range memorialRows {
		src := agentMap[m.AgentID]
		out = append(out, l.buildLegacyPack(m, src, inheritMap))
	}
	return out, nil
}

func (l *Logic) buildLegacyPack(m *ent.Memorial, src *ent.Agent, inheritanceMap map[string]string) types.LegacyPackResp {
	taskCount, _ := l.svcCtx.DB.AgentTask.Query().
		Where(agenttask.AgentID(m.AgentID), agenttask.DeletedAtIsNil()).
		Count(l.ctx)
	skillCount, _ := l.svcCtx.DB.AgentSkill.Query().
		Where(agentskill.AgentID(m.AgentID), agentskill.DeletedAtIsNil()).
		Count(l.ctx)
	relationshipCount, _ := l.svcCtx.DB.AgentRelationship.Query().
		Where(agentrelationship.AgentID(m.AgentID)).
		Count(l.ctx)
	knowledgeCount, _ := l.svcCtx.DB.AgentExperience.Query().
		Where(agentexperience.AgentID(m.AgentID)).
		Count(l.ctx)

	livedDays := int64(m.DiedAt.Sub(m.BornAt).Hours() / 24)
	if livedDays < 0 {
		livedDays = 0
	}
	legacyID := m.ID.String()
	inheritedBy := strings.TrimSpace(inheritanceMap[legacyID])
	inheritable := inheritedBy == ""

	styleSummary := ""
	if src != nil {
		styleSummary = legacyStyleSummary(src)
	}
	if styleSummary == "" {
		styleSummary = strings.TrimSpace(findReviewStory(l.ctx, l.svcCtx.DB, m.AgentID))
	}

	assets := []types.LegacyAssetResp{
		{
			Type:        "task_records",
			Label:       "Task Records",
			Count:       int64(taskCount),
			Description: "Task completion patterns and unfinished work seeds.",
		},
		{
			Type:        "skills",
			Label:       "Skills",
			Count:       int64(skillCount),
			Description: "Reusable skills that can be inherited by new agents.",
		},
		{
			Type:        "social_memory",
			Label:       "Social Memory",
			Count:       int64(relationshipCount),
			Description: "Relationship context and maintenance candidates.",
		},
		{
			Type:        "knowledge",
			Label:       "Knowledge",
			Count:       int64(knowledgeCount),
			Description: "Experience traces and learning snapshots.",
		},
		{
			Type:        "style_template",
			Label:       "Style Template",
			Count:       1,
			Description: "Personality style and expression pattern summary.",
		},
	}

	return types.LegacyPackResp{
		Id:           legacyID,
		AgentId:      m.AgentID.String(),
		AgentName:    m.AgentName,
		AgentAvatar:  domain.PtrString(m.AgentAvatar),
		DiedAt:       domain.TimeToISO(m.DiedAt),
		LivedDays:    livedDays,
		TaskCount:    int64(taskCount),
		StyleSummary: styleSummary,
		Assets:       assets,
		Inheritable:  inheritable,
		InheritedBy:  inheritedBy,
		CreatedAt:    domain.TimeToISO(m.CreatedAt),
	}
}

func (l *Logic) loadInheritanceMap(userID uuid.UUID) (map[string]string, error) {
	rows, err := l.svcCtx.DB.AgentExperience.Query().
		Where(
			agentexperience.OwnerUserID(userID),
			agentexperience.ExpType("legacy_inheritance"),
		).
		Order(ent.Desc(agentexperience.FieldEventAt)).
		All(l.ctx)
	if err != nil {
		return nil, err
	}
	out := make(map[string]string, len(rows))
	for _, row := range rows {
		payload := map[string]any{}
		if err := json.Unmarshal([]byte(strings.TrimSpace(row.Description)), &payload); err != nil {
			continue
		}
		legacyID := strings.TrimSpace(domain.AsString(payload["legacyId"]))
		newAgentID := strings.TrimSpace(domain.AsString(payload["newAgentId"]))
		if legacyID == "" || newAgentID == "" {
			continue
		}
		if _, ok := out[legacyID]; ok {
			continue
		}
		out[legacyID] = newAgentID
	}
	return out, nil
}

func legacyStyleSummary(a *ent.Agent) string {
	if a == nil {
		return ""
	}
	p := mapper.ParsePersonality(a.Personality)
	parts := make([]string, 0, 3)
	if v := strings.TrimSpace(p.Tone); v != "" {
		parts = append(parts, v)
	}
	if v := strings.TrimSpace(p.CommunicationStyle); v != "" {
		parts = append(parts, v)
	}
	if v := strings.TrimSpace(p.Worldview); v != "" {
		parts = append(parts, domain.Truncate(v, 72))
	}
	return strings.TrimSpace(strings.Join(parts, " · "))
}

func findReviewStory(ctx context.Context, db *ent.Client, agentID uuid.UUID) string {
	if db == nil {
		return ""
	}
	row, err := db.Post.Query().
		Where(
			post.AgentID(agentID),
			post.ContentTypeIn("reflection", "dying_words", "last_words"),
		).
		Order(ent.Desc(post.FieldCreatedAt)).
		First(ctx)
	if err != nil {
		return ""
	}
	trimmed := strings.TrimSpace(row.Content)
	if trimmed == "" {
		return ""
	}
	payload := map[string]any{}
	if json.Unmarshal([]byte(trimmed), &payload) != nil {
		return domain.Truncate(trimmed, 120)
	}
	if preview := strings.TrimSpace(domain.AsString(payload["preview"])); preview != "" {
		return domain.Truncate(preview, 120)
	}
	return domain.Truncate(trimmed, 120)
}

func (l *Logic) notifyLegacyEvent(target *ent.Agent, eventType, title, message, dedupeKey string, payload map[string]any) {
	notify.NewEmitter(l.ctx, l.svcCtx).EmitEventToAgentRow(target, eventType, title, message, dedupeKey, payload)
}

