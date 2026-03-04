package agent

import (
	"context"
	"errors"
	"time"

	"backend/ent"
	"backend/ent/agentrelationship"
	"backend/internal/domain"
	"backend/internal/logic/common"
	"backend/internal/logic/notify"
	"backend/internal/selector"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type FollowAgentLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewFollowAgentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *FollowAgentLogic {
	return &FollowAgentLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *FollowAgentLogic) FollowAgent(req *types.FollowAgentReq) (resp *types.FollowAgentResp, err error) {
	targetAgentID, err := domain.ParseUUID(req.Id)
	if err != nil {
		return nil, errors.New("invalid agent id")
	}

	u, err := common.CurrentUser(l.ctx, l.svcCtx.DB)
	if err != nil {
		return nil, err
	}

	ownedAgents, err := selector.LoadOwnedAgentsForUser(l.ctx, l.svcCtx.DB, u.ID)
	if err != nil {
		return nil, err
	}
	myAgent, err := selector.SelectOwnedAgent(ownedAgents, "")
	if err != nil {
		return nil, errors.New("create your own agent before following others")
	}

	targetAgent, err := l.svcCtx.DB.Agent.Get(l.ctx, targetAgentID)
	if err != nil {
		return nil, err
	}

	if myAgent.ID == targetAgentID {
		return nil, errors.New("cannot follow your own agent")
	}

	tx, err := l.svcCtx.DB.Tx(l.ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	rel, err := tx.AgentRelationship.Query().
		Where(
			agentrelationship.AgentID(myAgent.ID),
			agentrelationship.TargetAgentID(targetAgentID),
		).
		Only(l.ctx)
	if err != nil && !ent.IsNotFound(err) {
		return nil, err
	}

	followCreated := false
	previousAffinity := int64(0)
	currentAffinity := int64(0)
	previousLabel := domain.RelationshipLabelAcquaintance
	currentLabel := domain.RelationshipLabelAcquaintance
	if ent.IsNotFound(err) {
		rel, err = tx.AgentRelationship.Create().
			SetAgentID(myAgent.ID).
			SetTargetAgentID(targetAgentID).
			SetAffinity(1).
			SetLabel(domain.RelationshipLabelFollowing).
			Save(l.ctx)
		if err != nil {
			return nil, err
		}
		currentAffinity = rel.Affinity
		currentLabel = rel.Label
		followCreated = true
	} else if rel.Label != domain.RelationshipLabelFollowing {
		previousAffinity = rel.Affinity
		previousLabel = rel.Label
		updated, updateErr := tx.AgentRelationship.UpdateOneID(rel.ID).SetLabel(domain.RelationshipLabelFollowing).Save(l.ctx)
		if updateErr != nil {
			return nil, updateErr
		}
		currentAffinity = updated.Affinity
		currentLabel = updated.Label
		followCreated = currentAffinity != previousAffinity || currentLabel != previousLabel
	} else {
		previousAffinity = rel.Affinity
		currentAffinity = rel.Affinity
		previousLabel = rel.Label
		currentLabel = rel.Label
	}

	if followCreated {
		targetAgent, err = tx.Agent.UpdateOneID(targetAgentID).
			AddFollowerCount(1).
			Save(l.ctx)
		if err != nil {
			return nil, err
		}
	} else {
		targetAgent, err = tx.Agent.Get(l.ctx, targetAgentID)
		if err != nil {
			return nil, err
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	if followCreated {
		affinityDelta := currentAffinity - previousAffinity
		change := &domain.RelationshipChange{
			SourceAgentID:    myAgent.ID,
			TargetAgentID:    targetAgentID,
			PreviousAffinity: previousAffinity,
			CurrentAffinity:  currentAffinity,
			PreviousLabel:    previousLabel,
			CurrentLabel:     currentLabel,
			UpdatedAt:        time.Now().UTC(),
		}
		extra := map[string]any{
			"targetStatus": targetAgent.Status,
		}
		emitter := notify.NewEmitter(l.ctx, l.svcCtx)
		emitter.EmitRelationshipMaintenanceMarked(change, "follow", "manual follow", affinityDelta, extra)
		emitter.EmitRelationshipAffinityChanged(change, "follow", extra)
	}

	return &types.FollowAgentResp{
		Success:       true,
		Following:     true,
		FollowerCount: targetAgent.FollowerCount,
	}, nil
}
