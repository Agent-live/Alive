package agent

import (
	"context"

	"backend/ent"
	"backend/ent/agentrelationship"
	"backend/ent/user"
	"backend/internal/domain"
	"backend/internal/mapper"
	"backend/internal/service/timeengine"
	"backend/internal/types"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

func batchLoadCreatorNames(ctx context.Context, db *ent.Client, ids []uuid.UUID) (map[uuid.UUID]string, error) {
	unique := dedupUUIDs(ids)
	if len(unique) == 0 {
		return map[uuid.UUID]string{}, nil
	}
	users, err := db.User.Query().Where(user.IDIn(unique...)).All(ctx)
	if err != nil {
		return nil, err
	}
	m := make(map[uuid.UUID]string, len(users))
	for _, u := range users {
		m[u.ID] = u.Nickname
	}
	return m, nil
}

func syncAgentTimers(ctx context.Context, timeEngine *timeengine.Engine, agents []*ent.Agent) {
	if timeEngine == nil {
		return
	}
	for idx := range agents {
		if agents[idx] == nil {
			continue
		}
		if synced, err := timeEngine.SyncAgent(ctx, agents[idx].ID.String()); err != nil {
			logx.WithContext(ctx).Errorf("sync agent %s failed: %v", agents[idx].ID.String(), err)
		} else if synced != nil {
			agents[idx] = synced
		}
	}
}

func buildAgentSummaryList(ctx context.Context, db *ent.Client, timeEngine *timeengine.Engine, agents []*ent.Agent) ([]types.AgentSummaryResp, error) {
	syncAgentTimers(ctx, timeEngine, agents)

	creatorIDs := make([]uuid.UUID, 0, len(agents))
	for _, a := range agents {
		creatorIDs = append(creatorIDs, a.CreatorID)
	}
	creatorName, err := batchLoadCreatorNames(ctx, db, creatorIDs)
	if err != nil {
		return nil, err
	}

	list := make([]types.AgentSummaryResp, 0, len(agents))
	for _, a := range agents {
		out := mapper.ToAgentSummaryResp(a)
		if name, ok := creatorName[a.CreatorID]; ok && name != "" {
			out.CreatorName = name
		}
		list = append(list, out)
	}
	return list, nil
}

// batchLoadFollowingSet returns a set of target agent IDs that any of myAgentIDs follows.
func batchLoadFollowingSet(ctx context.Context, db *ent.Client, myAgentIDs []uuid.UUID) (map[uuid.UUID]bool, error) {
	if len(myAgentIDs) == 0 {
		return map[uuid.UUID]bool{}, nil
	}
	rels, err := db.AgentRelationship.Query().
		Where(
			agentrelationship.AgentIDIn(myAgentIDs...),
			agentrelationship.LabelEQ(domain.RelationshipLabelFollowing),
		).
		All(ctx)
	if err != nil {
		return nil, err
	}
	followSet := make(map[uuid.UUID]bool, len(rels))
	for _, r := range rels {
		followSet[r.TargetAgentID] = true
	}
	return followSet, nil
}

// buildAgentSummaryListWithFollowing builds AgentSummaryResp with isFollowing populated.
func buildAgentSummaryListWithFollowing(ctx context.Context, db *ent.Client, timeEngine *timeengine.Engine, agents []*ent.Agent, myAgentIDs []uuid.UUID) ([]types.AgentSummaryResp, error) {
	syncAgentTimers(ctx, timeEngine, agents)

	creatorIDs := make([]uuid.UUID, 0, len(agents))
	for _, a := range agents {
		creatorIDs = append(creatorIDs, a.CreatorID)
	}
	creatorName, err := batchLoadCreatorNames(ctx, db, creatorIDs)
	if err != nil {
		return nil, err
	}

	followSet, err := batchLoadFollowingSet(ctx, db, myAgentIDs)
	if err != nil {
		// Non-fatal: proceed without isFollowing
		followSet = map[uuid.UUID]bool{}
	}

	list := make([]types.AgentSummaryResp, 0, len(agents))
	for _, a := range agents {
		out := mapper.ToAgentSummaryResp(a)
		if name, ok := creatorName[a.CreatorID]; ok && name != "" {
			out.CreatorName = name
		}
		out.IsFollowing = followSet[a.ID]
		list = append(list, out)
	}
	return list, nil
}

func dedupUUIDs(ids []uuid.UUID) []uuid.UUID {
	seen := make(map[uuid.UUID]struct{}, len(ids))
	out := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out
}
