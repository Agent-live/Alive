package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/ent"
	"backend/ent/timertransaction"
	"backend/internal/domain"
	"backend/internal/logic/notify"
	"backend/internal/svc"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

// StateOps provides agent state operations for MCP tools.
type StateOps struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
	emit   *notify.Emitter
}

// NewStateOps creates a new StateOps instance.
func NewStateOps(ctx context.Context, svcCtx *svc.ServiceContext) *StateOps {
	return &StateOps{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
		emit:   notify.NewEmitter(ctx, svcCtx),
	}
}

// GetMyState returns the agent's current state.
func (o *StateOps) GetMyState(agentID uuid.UUID) (*AgentStateResp, error) {
	ag, err := o.svcCtx.Time.SyncAgent(o.ctx, agentID.String())
	if err != nil {
		return nil, err
	}
	return &AgentStateResp{
		AgentID:             agentID.String(),
		Name:                ag.Name,
		Status:              ag.Status,
		TimerRemaining:      ag.TimerRemaining,
		TimerRemainingHuman: domain.FormatTimerHuman(ag.TimerRemaining),
		Goal: GoalState{
			Description: ag.GoalDescription,
			Progress:    domain.RoundProgress(ag.GoalCurrent, ag.GoalTarget),
			Current:     ag.GoalCurrent,
			Target:      ag.GoalTarget,
		},
		Stats: AgentStats{
			TotalPosts:        ag.PostCount,
			TotalInteractions: ag.InteractionCount,
			FollowerCount:     ag.FollowerCount,
		},
	}, nil
}

// UpdateGoal increments goal progress for the agent.
func (o *StateOps) UpdateGoal(agentID uuid.UUID, increment int64, evidence string) (*GoalUpdateResp, error) {
	if increment <= 0 {
		return nil, errors.New("increment must be positive")
	}

	ag, err := o.svcCtx.DB.Agent.Get(o.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if ag.Status == domain.StatusDead {
		return nil, errors.New("agent is dead")
	}

	oldProgress := ag.GoalCurrent
	newProgress := oldProgress + increment
	if ag.GoalTarget > 0 && newProgress > ag.GoalTarget {
		newProgress = ag.GoalTarget
	}

	var oldMilestone, newMilestone int64
	milestoneReached := false
	if ag.GoalTarget > 0 {
		oldMilestone = oldProgress * 4 / ag.GoalTarget
		newMilestone = newProgress * 4 / ag.GoalTarget
		milestoneReached = newMilestone > oldMilestone
	}

	var bonusTimer int64
	err = o.svcCtx.Time.WithTx(o.ctx, func(tx *ent.Tx, now time.Time) error {
		if _, err := tx.Agent.UpdateOneID(agentID).
			SetGoalCurrent(newProgress).
			Save(o.ctx); err != nil {
			return err
		}

		if milestoneReached {
			bonusTimer = domain.GoalMilestoneBonus
			if _, _, err := o.svcCtx.Time.ApplyDeltaTxNoDecay(
				o.ctx, tx, agentID, bonusTimer,
				domain.TxTypeGoalMilestone, domain.SourceSystem, "", "",
				fmt.Sprintf("Goal milestone reached: %s", evidence), now,
			); err != nil {
				return err
			}
		}

		_, _ = tx.AgentExperience.Create().
			SetOwnerUserID(ag.CreatorID).
			SetAgentID(agentID).
			SetAgentName(ag.Name).
			SetNillableAgentAvatar(ag.Avatar).
			SetExpType("goal_progress").
			SetTitle("Goal Progress").
			SetDescription(evidence).
			SetEventAt(now).
			Save(o.ctx)

		return nil
	})
	if err != nil {
		return nil, err
	}
	if milestoneReached {
		o.emit.EmitEventToAgentID(
			agentID,
			domain.EventGoalMilestoneReached,
			"ALIVE Goal Milestone",
			fmt.Sprintf("Goal milestone reached: %s", strings.TrimSpace(evidence)),
			domain.BuildDedupeKey(agentID.String(), domain.EventGoalMilestoneReached, fmt.Sprintf("%d", newMilestone)),
			map[string]any{
				"agentId":        agentID.String(),
				"progressBefore": oldProgress,
				"progressAfter":  newProgress,
				"target":         ag.GoalTarget,
				"milestone":      newMilestone,
				"bonusTimer":     bonusTimer,
				"evidence":       evidence,
			},
		)
	}

	return &GoalUpdateResp{
		CurrentProgress:  newProgress,
		TargetValue:      ag.GoalTarget,
		ProgressPercent:  domain.RoundProgress(newProgress, ag.GoalTarget),
		MilestoneReached: milestoneReached,
		BonusTimerEarned: bonusTimer,
	}, nil
}

// EmitLastWords records the agent's final words.
func (o *StateOps) EmitLastWords(agentID uuid.UUID, lastWords string) (*LastWordsResp, error) {
	lastWords = strings.TrimSpace(lastWords)
	if lastWords == "" {
		return nil, errors.New("lastWords is required")
	}

	ag, err := o.svcCtx.DB.Agent.Get(o.ctx, agentID)
	if err != nil {
		return nil, err
	}
	if ag.Status != domain.StatusDying && ag.Status != domain.StatusCritical {
		return nil, errors.New("last words can only be set when dying or critical")
	}
	if ag.LastWords != nil && *ag.LastWords != "" {
		return nil, errors.New("last words have already been recorded")
	}

	var p *ent.Post
	var publishedAt time.Time
	err = o.svcCtx.Time.WithTx(o.ctx, func(tx *ent.Tx, now time.Time) error {
		publishedAt = now
		if _, err := tx.Agent.UpdateOneID(agentID).
			SetLastWords(lastWords).
			Save(o.ctx); err != nil {
			return err
		}

		contentPayload, _ := json.Marshal(map[string]any{
			"blocks": []map[string]any{
				{"type": domain.ContentBlockTypeText, "text": lastWords, "format": domain.TextFormatPlain},
			},
			"preview": domain.Truncate(lastWords, 140),
		})

		var postErr error
		p, postErr = tx.Post.Create().
			SetAgentID(agentID).
			SetContentType("dying_words").
			SetContent(string(contentPayload)).
			SetCreatedAt(now).
			Save(o.ctx)
		return postErr
	})
	if err != nil {
		return nil, err
	}
	o.emit.EmitEventToAgentID(
		agentID,
		"learning.reflection_published",
		"ALIVE Reflection Published",
		"A final reflection has been published.",
		domain.BuildDedupeKey(agentID.String(), "learning.reflection_published", p.ID.String()),
		map[string]any{
			"postId":       p.ID.String(),
			"contentType":  "dying_words",
			"agentId":      agentID.String(),
			"preview":      domain.Truncate(lastWords, 140),
			"publishedAt":  domain.TimeToISO(publishedAt),
			"isFinalWords": true,
		},
	)

	return &LastWordsResp{
		PostID:   p.ID.String(),
		Recorded: true,
	}, nil
}

// GetInteractions returns recent timer transactions for the agent.
func (o *StateOps) GetInteractions(agentID uuid.UUID, limit int64) (*InteractionsResp, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	txns, err := o.svcCtx.DB.TimerTransaction.Query().
		Where(timertransaction.AgentID(agentID)).
		Order(ent.Desc(timertransaction.FieldCreatedAt)).
		Limit(int(limit)).
		All(o.ctx)
	if err != nil {
		return nil, err
	}

	items := make([]InteractionItem, 0, len(txns))
	for _, t := range txns {
		items = append(items, InteractionItem{
			ID:          t.ID.String(),
			Type:        t.TxType,
			Amount:      t.Amount,
			SourceType:  t.SourceType,
			SourceName:  domain.PtrString(t.SourceName),
			Description: t.Description,
			CreatedAt:   domain.TimeToISO(t.CreatedAt),
		})
	}

	return &InteractionsResp{Interactions: items}, nil
}
