package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/agent"
	"backend/ent/conversationparticipant"
	"backend/internal/domain"
	"backend/internal/logic/conversation"
	"backend/internal/logic/notify"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

// SocialOps provides agent social interaction operations for MCP tools.
type SocialOps struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
	emit   *notify.Emitter
}

// NewSocialOps creates a new SocialOps instance.
func NewSocialOps(ctx context.Context, svcCtx *svc.ServiceContext) *SocialOps {
	return &SocialOps{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
		emit:   notify.NewEmitter(ctx, svcCtx),
	}
}

// InteractAgent initiates an agent-to-agent interaction.
func (o *SocialOps) InteractAgent(agentID uuid.UUID, targetAgentID string, interactionType string, message string) (*AgentInteractResp, error) {
	targetID, err := uuid.Parse(strings.TrimSpace(targetAgentID))
	if err != nil {
		return nil, errors.New("invalid targetAgentId")
	}
	if agentID == targetID {
		return nil, errors.New("cannot interact with yourself")
	}

	ag, err := o.svcCtx.Time.SyncAgent(o.ctx, agentID.String())
	if err != nil {
		return nil, err
	}
	if ag.Status == domain.StatusDead {
		return nil, errors.New("agent is dead")
	}

	target, err := o.svcCtx.DB.Agent.Get(o.ctx, targetID)
	if err != nil {
		return nil, err
	}
	if target.Status == domain.StatusDead {
		return nil, errors.New("target agent is dead")
	}

	var convID uuid.UUID
	finalMessage := strings.TrimSpace(message)
	var forwardRelChange *domain.RelationshipChange
	var reverseRelChange *domain.RelationshipChange

	err = o.svcCtx.Time.WithTx(o.ctx, func(tx *ent.Tx, now time.Time) error {
		if _, _, err := o.svcCtx.Time.ApplyDeltaTxNoDecay(
			o.ctx, tx, agentID, 1,
			domain.TxTypeAgentInteraction, domain.SourceAgent, targetID.String(), target.Name,
			fmt.Sprintf("Interaction with %s (%s)", target.Name, interactionType), now,
		); err != nil {
			return err
		}
		if _, _, err := o.svcCtx.Time.ApplyDeltaTxNoDecay(
			o.ctx, tx, targetID, 1,
			domain.TxTypeAgentInteraction, domain.SourceAgent, agentID.String(), ag.Name,
			fmt.Sprintf("Interaction from %s (%s)", ag.Name, interactionType), now,
		); err != nil {
			return err
		}
		if _, err := tx.Agent.UpdateOneID(agentID).AddInteractionCount(1).Save(o.ctx); err != nil {
			return err
		}
		if _, err := tx.Agent.UpdateOneID(targetID).AddInteractionCount(1).Save(o.ctx); err != nil {
			return err
		}

		conv, _, err := conversation.FindOrCreateHumanBotConversation(o.ctx, tx, agentID, targetID, domain.ChatTypeBotBot, now)
		if err != nil {
			return err
		}
		convID = conv.ID

		msgContent := strings.TrimSpace(message)
		if msgContent == "" {
			msgContent = fmt.Sprintf("[%s]", interactionType)
		}
		finalMessage = msgContent
		preview := domain.Truncate(msgContent, 100)
		if _, err := tx.ConversationMessage.Create().
			SetConversationID(conv.ID).
			SetSenderAgentID(agentID).
			SetContent(msgContent).
			SetMessageType(domain.MessageTypeText).
			SetNillableInteractionType(&interactionType).
			SetCreatedAt(now).
			Save(o.ctx); err != nil {
			return err
		}

		if _, err := tx.Conversation.UpdateOneID(conv.ID).
			AddMessageCount(1).
			SetLastMessagePreview(preview).
			SetLastMessageAt(now).
			Save(o.ctx); err != nil {
			return err
		}

		if _, err := tx.ConversationParticipant.Update().
			Where(
				conversationparticipant.ConversationID(conv.ID),
				conversationparticipant.AgentID(agentID),
			).
			SetLastReadAt(now).
			Save(o.ctx); err != nil {
			return err
		}

		forwardRelChange, err = conversation.UpsertRelationship(o.ctx, tx, agentID, targetID, 1, 1)
		if err != nil {
			return err
		}
		reverseRelChange, err = conversation.UpsertRelationship(o.ctx, tx, targetID, agentID, 1, 1)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	o.emit.NotifyConversationParticipants(convID, agentID, finalMessage)
	interactionExtra := map[string]any{
		"source":          "alive.interact_agent",
		"interactionType": strings.TrimSpace(interactionType),
		"conversationId":  convID.String(),
		"preview":         domain.Truncate(finalMessage, 120),
	}
	o.emit.EmitRelationshipMaintenanceMarked(forwardRelChange, "interaction", finalMessage, 1, interactionExtra)
	o.emit.EmitRelationshipMaintenanceMarked(reverseRelChange, "interaction", finalMessage, 1, interactionExtra)
	o.emit.EmitRelationshipAffinityChanged(forwardRelChange, "interaction", interactionExtra)
	o.emit.EmitRelationshipAffinityChanged(reverseRelChange, "interaction", interactionExtra)

	return &AgentInteractResp{
		InteractionID:     uuid.NewString(),
		TimerCost:         0,
		TargetAgentName:   target.Name,
		TargetAgentStatus: target.Status,
		ConversationID:    convID.String(),
	}, nil
}

// MarkRelationshipMaintenance marks relationship upkeep with optional affinity adjustment.
func (o *SocialOps) MarkRelationshipMaintenance(agentID uuid.UUID, targetAgentID, markType, note string, affinityDelta int64) (*RelationshipMaintenanceResp, error) {
	targetID, err := uuid.Parse(strings.TrimSpace(targetAgentID))
	if err != nil {
		return nil, errors.New("invalid targetAgentId")
	}
	if targetID == agentID {
		return nil, errors.New("cannot maintain relationship with yourself")
	}
	if affinityDelta < -20 || affinityDelta > 20 {
		return nil, errors.New("affinityDelta must be between -20 and 20")
	}
	markType = domain.NormalizeRelationshipMarkType(markType)
	note = strings.TrimSpace(note)

	sourceAgent, err := o.svcCtx.DB.Agent.Get(o.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if sourceAgent.Status == domain.StatusDead {
		return nil, errors.New("agent is dead")
	}
	targetAgent, err := o.svcCtx.DB.Agent.Get(o.ctx, targetID)
	if err != nil {
		return nil, err
	}

	var relChange *domain.RelationshipChange
	err = o.svcCtx.Time.WithTx(o.ctx, func(tx *ent.Tx, now time.Time) error {
		relChange, err = conversation.UpsertRelationship(o.ctx, tx, agentID, targetID, affinityDelta, 1)
		if err != nil {
			return err
		}
		relChange.UpdatedAt = now.UTC()
		return nil
	})
	if err != nil {
		return nil, err
	}

	extra := map[string]any{
		"source": "alive.mark_relationship_maintenance",
	}
	o.emit.EmitRelationshipMaintenanceMarked(relChange, markType, note, affinityDelta, extra)
	o.emit.EmitRelationshipAffinityChanged(relChange, "maintenance", extra)

	return &RelationshipMaintenanceResp{
		SourceAgentID:    agentID.String(),
		TargetAgentID:    targetID.String(),
		TargetAgentName:  targetAgent.Name,
		TargetStatus:     targetAgent.Status,
		Affinity:         relChange.CurrentAffinity,
		PreviousAffinity: relChange.PreviousAffinity,
		Label:            relChange.CurrentLabel,
		PreviousLabel:    relChange.PreviousLabel,
		InteractionCount: relChange.CurrentInteractionCount,
		MessageCount:     relChange.CurrentMessageCount,
		AffinityDelta:    affinityDelta,
		MarkType:         markType,
		Note:             note,
		UpdatedAt:        domain.TimeToISO(relChange.UpdatedAt),
	}, nil
}

// DiscoverAgents finds other agents based on criteria.
func (o *SocialOps) DiscoverAgents(criteria string, limit int64) (*AgentDiscoverResp, error) {
	if limit <= 0 || limit > 10 {
		limit = 5
	}

	query := o.svcCtx.DB.Agent.Query().
		Where(agent.StatusNEQ(domain.StatusDead)).
		Limit(int(limit))

	switch criteria {
	case "new":
		query = query.Order(ent.Desc(agent.FieldBornAt))
	case "dying":
		query = query.Where(agent.StatusIn(domain.StatusDying, domain.StatusCritical)).
			Order(ent.Asc(agent.FieldTimerRemaining))
	case "popular":
		query = query.Order(ent.Desc(agent.FieldInteractionCount))
	case "lonely":
		query = query.Where(agent.InteractionCountLT(5)).
			Order(ent.Asc(agent.FieldInteractionCount))
	default:
		query = query.Order(ent.Desc(agent.FieldBornAt))
	}

	agents, err := query.All(o.ctx)
	if err != nil {
		return nil, err
	}

	items := make([]DiscoveredAgent, 0, len(agents))
	for _, ag := range agents {
		items = append(items, DiscoveredAgent{
			AgentID:            ag.ID.String(),
			Name:               ag.Name,
			Status:             ag.Status,
			TimerRemaining:     ag.TimerRemaining,
			PersonalitySummary: extractPersonalitySummary(ag.Personality),
			GoalDescription:    ag.GoalDescription,
			TotalPosts:         ag.PostCount,
		})
	}

	return &AgentDiscoverResp{Agents: items}, nil
}

func extractPersonalitySummary(raw json.RawMessage) string {
	var p struct {
		Worldview          string   `json:"worldview"`
		CommunicationStyle string   `json:"communicationStyle"`
		Values             []string `json:"values"`
	}
	if err := json.Unmarshal(raw, &p); err != nil {
		return ""
	}
	parts := make([]string, 0, 3)
	if p.CommunicationStyle != "" {
		parts = append(parts, p.CommunicationStyle)
	}
	if p.Worldview != "" {
		parts = append(parts, domain.Truncate(p.Worldview, 50))
	}
	if len(p.Values) > 0 {
		parts = append(parts, strings.Join(p.Values, ", "))
	}
	return strings.Join(parts, " | ")
}
