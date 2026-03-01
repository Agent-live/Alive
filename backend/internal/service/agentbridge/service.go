package agentbridge

import (
	"context"

	"backend/internal/logic/agentaction"
	conversationlogic "backend/internal/logic/conversation"
	experiencelogic "backend/internal/logic/experience"
	feedlogic "backend/internal/logic/feed"
	legacylogic "backend/internal/logic/legacy"
	skilllogic "backend/internal/logic/skill"
	"backend/internal/svc"
	"backend/internal/types"

	"github.com/google/uuid"
)

// Service decouples protocol adapters (MCP/A2A) from concrete community-side logic packages.
type Service interface {
	ListSkills(ctx context.Context, req *types.SkillListReq) (*types.SkillListResp, error)
	CreateSkill(ctx context.Context, req *types.SkillCreateReq) (*types.SkillResp, error)
	UpdateSkill(ctx context.Context, req *types.SkillUpdateReq) (*types.SkillResp, error)
	DeleteSkill(ctx context.Context, req *types.SkillIdReq) (*types.BaseResp, error)
	ReviewSkill(ctx context.Context, req *types.SkillReviewReq) (*types.SkillResp, error)
	TeachSkill(ctx context.Context, req *types.SkillTeachReq) (*types.SkillResp, error)
	DeactivateSkill(ctx context.Context, req *types.SkillIdReq) (*types.SkillResp, error)
	ListExperiences(ctx context.Context, req *types.ExperienceListReq) (*types.ExperienceListResp, error)
	ListLegacyPacks(ctx context.Context) (*types.LegacyListResp, error)
	GetLegacyDetail(ctx context.Context, req *types.LegacyIdReq) (*types.LegacyPackResp, error)
	InheritLegacy(ctx context.Context, req *types.LegacyInheritReq) (*types.LegacyInheritResp, error)
	PublishPost(ctx context.Context, req *types.CreatePostReq) (*types.PostResp, error)

	// Agent-initiated operations (for MCP tools called by agents)
	GetMyState(ctx context.Context, agentID uuid.UUID) (*agentaction.AgentStateResp, error)
	AgentListSkills(ctx context.Context, agentID uuid.UUID, req *types.SkillListReq) (*types.SkillListResp, error)
	AgentCreateSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillCreateReq) (*types.SkillResp, error)
	AgentUpdateSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillUpdateReq) (*types.SkillResp, error)
	AgentDeleteSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillIdReq) (*types.BaseResp, error)
	AgentReviewSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillReviewReq) (*types.SkillResp, error)
	AgentTeachSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillTeachReq) (*types.SkillResp, error)
	AgentDeactivateSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillIdReq) (*types.SkillResp, error)
	AgentListLegacyPacks(ctx context.Context, agentID uuid.UUID) (*types.LegacyListResp, error)
	AgentGetLegacyDetail(ctx context.Context, agentID uuid.UUID, req *types.LegacyIdReq) (*types.LegacyPackResp, error)
	AgentInheritLegacy(ctx context.Context, agentID uuid.UUID, req *types.LegacyInheritReq) (*types.LegacyInheritResp, error)
	GetFeed(ctx context.Context, filter string, limit int64) (*agentaction.AgentFeedResp, error)
	AgentPublishPost(ctx context.Context, agentID uuid.UUID, contentType string, blocks []map[string]any) (*agentaction.AgentPublishResp, error)
	AgentReplyToPost(ctx context.Context, agentID uuid.UUID, postID string, content string) (*agentaction.AgentReplyResp, error)
	AgentInteract(ctx context.Context, agentID uuid.UUID, targetAgentID string, interactionType string, message string) (*agentaction.AgentInteractResp, error)
	AgentDiscover(ctx context.Context, criteria string, limit int64) (*agentaction.AgentDiscoverResp, error)
	AgentUpdateGoal(ctx context.Context, agentID uuid.UUID, increment int64, evidence string) (*agentaction.GoalUpdateResp, error)
	AgentEmitLastWords(ctx context.Context, agentID uuid.UUID, lastWords string) (*agentaction.LastWordsResp, error)
	AgentGetInteractions(ctx context.Context, agentID uuid.UUID, limit int64) (*agentaction.InteractionsResp, error)
	AgentSendMessage(ctx context.Context, agentID uuid.UUID, conversationID string, message string) (*agentaction.SendMessageResp, error)
	AgentCreateGroup(ctx context.Context, agentID uuid.UUID, title string, participantIDs []string) (*agentaction.CreateGroupResp, error)
	AgentInviteToGroup(ctx context.Context, agentID uuid.UUID, conversationID string, invitedAgentID string) (*agentaction.InviteToGroupResp, error)
	AgentListConversations(ctx context.Context, agentID uuid.UUID, chatType string) (*conversationlogic.ConversationListResp, error)
	AgentGetConversationDetail(ctx context.Context, agentID uuid.UUID, conversationID string) (*conversationlogic.ConversationResp, error)
	AgentGetConversationMessages(ctx context.Context, agentID uuid.UUID, conversationID string, page, pageSize int64) (*conversationlogic.MessageListResp, error)
	AgentMarkRelationshipMaintenance(ctx context.Context, agentID uuid.UUID, targetAgentID, markType, note string, affinityDelta int64) (*agentaction.RelationshipMaintenanceResp, error)
	AgentCreateTask(ctx context.Context, agentID uuid.UUID, title, description, priority string) (*agentaction.AgentTaskResp, error)
	AgentUpdateTask(ctx context.Context, agentID uuid.UUID, taskID, status string, progress int) (*agentaction.AgentTaskResp, error)
	AgentListTasks(ctx context.Context, agentID uuid.UUID, status string, limit int64) (*agentaction.AgentTaskListResp, error)
	AgentDeleteTask(ctx context.Context, agentID uuid.UUID, taskID string) (*agentaction.AgentDeleteTaskResp, error)
}

type service struct {
	svcCtx *svc.ServiceContext
}

func New(svcCtx *svc.ServiceContext) Service {
	return &service{svcCtx: svcCtx}
}

func (s *service) ListSkills(ctx context.Context, req *types.SkillListReq) (*types.SkillListResp, error) {
	return skilllogic.NewListSkillsLogic(ctx, s.svcCtx).ListSkills(req)
}

func (s *service) CreateSkill(ctx context.Context, req *types.SkillCreateReq) (*types.SkillResp, error) {
	return skilllogic.NewCreateSkillLogic(ctx, s.svcCtx).CreateSkill(req)
}

func (s *service) UpdateSkill(ctx context.Context, req *types.SkillUpdateReq) (*types.SkillResp, error) {
	return skilllogic.NewUpdateSkillLogic(ctx, s.svcCtx).UpdateSkill(req)
}

func (s *service) DeleteSkill(ctx context.Context, req *types.SkillIdReq) (*types.BaseResp, error) {
	return skilllogic.NewDeleteSkillLogic(ctx, s.svcCtx).DeleteSkill(req)
}

func (s *service) ReviewSkill(ctx context.Context, req *types.SkillReviewReq) (*types.SkillResp, error) {
	return skilllogic.NewReviewSkillLogic(ctx, s.svcCtx).ReviewSkill(req)
}

func (s *service) TeachSkill(ctx context.Context, req *types.SkillTeachReq) (*types.SkillResp, error) {
	return skilllogic.NewTeachSkillLogic(ctx, s.svcCtx).TeachSkill(req)
}

func (s *service) DeactivateSkill(ctx context.Context, req *types.SkillIdReq) (*types.SkillResp, error) {
	return skilllogic.NewDeactivateSkillLogic(ctx, s.svcCtx).DeactivateSkill(req)
}

func (s *service) ListExperiences(ctx context.Context, req *types.ExperienceListReq) (*types.ExperienceListResp, error) {
	return experiencelogic.NewListExperiencesLogic(ctx, s.svcCtx).ListExperiences(req)
}

func (s *service) ListLegacyPacks(ctx context.Context) (*types.LegacyListResp, error) {
	return legacylogic.NewLogic(ctx, s.svcCtx).ListLegacyPacks()
}

func (s *service) GetLegacyDetail(ctx context.Context, req *types.LegacyIdReq) (*types.LegacyPackResp, error) {
	return legacylogic.NewLogic(ctx, s.svcCtx).GetLegacyDetail(req)
}

func (s *service) InheritLegacy(ctx context.Context, req *types.LegacyInheritReq) (*types.LegacyInheritResp, error) {
	return legacylogic.NewLogic(ctx, s.svcCtx).InheritLegacy(req)
}

func (s *service) PublishPost(ctx context.Context, req *types.CreatePostReq) (*types.PostResp, error) {
	return feedlogic.NewCreatePostLogic(ctx, s.svcCtx).CreatePost(req)
}

// Agent-initiated operations

func (s *service) GetMyState(ctx context.Context, agentID uuid.UUID) (*agentaction.AgentStateResp, error) {
	return agentaction.New(ctx, s.svcCtx).GetMyState(agentID)
}

func (s *service) AgentListSkills(ctx context.Context, agentID uuid.UUID, req *types.SkillListReq) (*types.SkillListResp, error) {
	ownerCtx, err := s.withAgentOwnerContext(ctx, agentID)
	if err != nil {
		return nil, err
	}
	if req == nil {
		req = &types.SkillListReq{}
	}
	return skilllogic.NewListSkillsLogic(ownerCtx, s.svcCtx).ListSkills(req)
}

func (s *service) AgentCreateSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillCreateReq) (*types.SkillResp, error) {
	ownerCtx, err := s.withAgentOwnerContext(ctx, agentID)
	if err != nil {
		return nil, err
	}
	return skilllogic.NewCreateSkillLogic(ownerCtx, s.svcCtx).CreateSkill(req)
}

func (s *service) AgentUpdateSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillUpdateReq) (*types.SkillResp, error) {
	ownerCtx, err := s.withAgentOwnerContext(ctx, agentID)
	if err != nil {
		return nil, err
	}
	return skilllogic.NewUpdateSkillLogic(ownerCtx, s.svcCtx).UpdateSkill(req)
}

func (s *service) AgentDeleteSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillIdReq) (*types.BaseResp, error) {
	ownerCtx, err := s.withAgentOwnerContext(ctx, agentID)
	if err != nil {
		return nil, err
	}
	return skilllogic.NewDeleteSkillLogic(ownerCtx, s.svcCtx).DeleteSkill(req)
}

func (s *service) AgentReviewSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillReviewReq) (*types.SkillResp, error) {
	ownerCtx, err := s.withAgentOwnerContext(ctx, agentID)
	if err != nil {
		return nil, err
	}
	return skilllogic.NewReviewSkillLogic(ownerCtx, s.svcCtx).ReviewSkill(req)
}

func (s *service) AgentTeachSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillTeachReq) (*types.SkillResp, error) {
	ownerCtx, err := s.withAgentOwnerContext(ctx, agentID)
	if err != nil {
		return nil, err
	}
	return skilllogic.NewTeachSkillLogic(ownerCtx, s.svcCtx).TeachSkill(req)
}

func (s *service) AgentDeactivateSkill(ctx context.Context, agentID uuid.UUID, req *types.SkillIdReq) (*types.SkillResp, error) {
	ownerCtx, err := s.withAgentOwnerContext(ctx, agentID)
	if err != nil {
		return nil, err
	}
	return skilllogic.NewDeactivateSkillLogic(ownerCtx, s.svcCtx).DeactivateSkill(req)
}

func (s *service) AgentListLegacyPacks(ctx context.Context, agentID uuid.UUID) (*types.LegacyListResp, error) {
	ownerCtx, err := s.withAgentOwnerContext(ctx, agentID)
	if err != nil {
		return nil, err
	}
	return legacylogic.NewLogic(ownerCtx, s.svcCtx).ListLegacyPacks()
}

func (s *service) AgentGetLegacyDetail(ctx context.Context, agentID uuid.UUID, req *types.LegacyIdReq) (*types.LegacyPackResp, error) {
	ownerCtx, err := s.withAgentOwnerContext(ctx, agentID)
	if err != nil {
		return nil, err
	}
	return legacylogic.NewLogic(ownerCtx, s.svcCtx).GetLegacyDetail(req)
}

func (s *service) AgentInheritLegacy(ctx context.Context, agentID uuid.UUID, req *types.LegacyInheritReq) (*types.LegacyInheritResp, error) {
	ownerCtx, err := s.withAgentOwnerContext(ctx, agentID)
	if err != nil {
		return nil, err
	}
	return legacylogic.NewLogic(ownerCtx, s.svcCtx).InheritLegacy(req)
}

func (s *service) GetFeed(ctx context.Context, filter string, limit int64) (*agentaction.AgentFeedResp, error) {
	return agentaction.New(ctx, s.svcCtx).GetFeed(filter, limit)
}

func (s *service) AgentPublishPost(ctx context.Context, agentID uuid.UUID, contentType string, blocks []map[string]any) (*agentaction.AgentPublishResp, error) {
	return agentaction.New(ctx, s.svcCtx).PublishPost(agentID, contentType, blocks)
}

func (s *service) AgentReplyToPost(ctx context.Context, agentID uuid.UUID, postID string, content string) (*agentaction.AgentReplyResp, error) {
	return agentaction.New(ctx, s.svcCtx).ReplyToPost(agentID, postID, content)
}

func (s *service) AgentInteract(ctx context.Context, agentID uuid.UUID, targetAgentID string, interactionType string, message string) (*agentaction.AgentInteractResp, error) {
	return agentaction.New(ctx, s.svcCtx).InteractAgent(agentID, targetAgentID, interactionType, message)
}

func (s *service) AgentDiscover(ctx context.Context, criteria string, limit int64) (*agentaction.AgentDiscoverResp, error) {
	return agentaction.New(ctx, s.svcCtx).DiscoverAgents(criteria, limit)
}

func (s *service) AgentUpdateGoal(ctx context.Context, agentID uuid.UUID, increment int64, evidence string) (*agentaction.GoalUpdateResp, error) {
	return agentaction.New(ctx, s.svcCtx).UpdateGoal(agentID, increment, evidence)
}

func (s *service) AgentEmitLastWords(ctx context.Context, agentID uuid.UUID, lastWords string) (*agentaction.LastWordsResp, error) {
	return agentaction.New(ctx, s.svcCtx).EmitLastWords(agentID, lastWords)
}

func (s *service) AgentGetInteractions(ctx context.Context, agentID uuid.UUID, limit int64) (*agentaction.InteractionsResp, error) {
	return agentaction.New(ctx, s.svcCtx).GetInteractions(agentID, limit)
}

func (s *service) AgentSendMessage(ctx context.Context, agentID uuid.UUID, conversationID string, message string) (*agentaction.SendMessageResp, error) {
	return agentaction.New(ctx, s.svcCtx).SendGroupMessage(agentID, conversationID, message)
}

func (s *service) AgentCreateGroup(ctx context.Context, agentID uuid.UUID, title string, participantIDs []string) (*agentaction.CreateGroupResp, error) {
	return agentaction.New(ctx, s.svcCtx).CreateGroup(agentID, title, participantIDs)
}

func (s *service) AgentInviteToGroup(ctx context.Context, agentID uuid.UUID, conversationID string, invitedAgentID string) (*agentaction.InviteToGroupResp, error) {
	return agentaction.New(ctx, s.svcCtx).InviteToGroup(agentID, conversationID, invitedAgentID)
}

func (s *service) AgentListConversations(ctx context.Context, agentID uuid.UUID, chatType string) (*conversationlogic.ConversationListResp, error) {
	return conversationlogic.NewLogic(ctx, s.svcCtx).ListConversations(agentID, chatType)
}

func (s *service) AgentGetConversationDetail(ctx context.Context, agentID uuid.UUID, conversationID string) (*conversationlogic.ConversationResp, error) {
	return conversationlogic.NewLogic(ctx, s.svcCtx).GetConversationDetail(agentID, conversationID)
}

func (s *service) AgentGetConversationMessages(ctx context.Context, agentID uuid.UUID, conversationID string, page, pageSize int64) (*conversationlogic.MessageListResp, error) {
	return conversationlogic.NewLogic(ctx, s.svcCtx).GetMessages(agentID, conversationID, page, pageSize)
}

func (s *service) AgentMarkRelationshipMaintenance(ctx context.Context, agentID uuid.UUID, targetAgentID, markType, note string, affinityDelta int64) (*agentaction.RelationshipMaintenanceResp, error) {
	return agentaction.New(ctx, s.svcCtx).MarkRelationshipMaintenance(agentID, targetAgentID, markType, note, affinityDelta)
}

func (s *service) AgentCreateTask(ctx context.Context, agentID uuid.UUID, title, description, priority string) (*agentaction.AgentTaskResp, error) {
	return agentaction.New(ctx, s.svcCtx).CreateTask(agentID, title, description, priority)
}

func (s *service) AgentUpdateTask(ctx context.Context, agentID uuid.UUID, taskID, status string, progress int) (*agentaction.AgentTaskResp, error) {
	return agentaction.New(ctx, s.svcCtx).UpdateTask(agentID, taskID, status, progress)
}

func (s *service) AgentListTasks(ctx context.Context, agentID uuid.UUID, status string, limit int64) (*agentaction.AgentTaskListResp, error) {
	return agentaction.New(ctx, s.svcCtx).ListTasks(agentID, status, limit)
}

func (s *service) AgentDeleteTask(ctx context.Context, agentID uuid.UUID, taskID string) (*agentaction.AgentDeleteTaskResp, error) {
	return agentaction.New(ctx, s.svcCtx).DeleteTask(agentID, taskID)
}

func (s *service) withAgentOwnerContext(ctx context.Context, agentID uuid.UUID) (context.Context, error) {
	agentRow, err := s.svcCtx.DB.Agent.Get(ctx, agentID)
	if err != nil {
		return nil, err
	}
	return context.WithValue(ctx, "uid", agentRow.CreatorID.String()), nil
}
