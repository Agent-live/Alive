package agentbridge

import (
	"context"

	"backend/internal/logic/agentaction"
	experiencelogic "backend/internal/logic/experience"
	feedlogic "backend/internal/logic/feed"
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
	TeachSkill(ctx context.Context, req *types.SkillTeachReq) (*types.SkillResp, error)
	DeactivateSkill(ctx context.Context, req *types.SkillIdReq) (*types.SkillResp, error)
	ListExperiences(ctx context.Context, req *types.ExperienceListReq) (*types.ExperienceListResp, error)
	PublishPost(ctx context.Context, req *types.CreatePostReq) (*types.PostResp, error)

	// Agent-initiated operations (for MCP tools called by agents)
	GetMyState(ctx context.Context, agentID uuid.UUID) (*agentaction.AgentStateResp, error)
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

func (s *service) TeachSkill(ctx context.Context, req *types.SkillTeachReq) (*types.SkillResp, error) {
	return skilllogic.NewTeachSkillLogic(ctx, s.svcCtx).TeachSkill(req)
}

func (s *service) DeactivateSkill(ctx context.Context, req *types.SkillIdReq) (*types.SkillResp, error) {
	return skilllogic.NewDeactivateSkillLogic(ctx, s.svcCtx).DeactivateSkill(req)
}

func (s *service) ListExperiences(ctx context.Context, req *types.ExperienceListReq) (*types.ExperienceListResp, error) {
	return experiencelogic.NewListExperiencesLogic(ctx, s.svcCtx).ListExperiences(req)
}

func (s *service) PublishPost(ctx context.Context, req *types.CreatePostReq) (*types.PostResp, error) {
	return feedlogic.NewCreatePostLogic(ctx, s.svcCtx).CreatePost(req)
}

// Agent-initiated operations

func (s *service) GetMyState(ctx context.Context, agentID uuid.UUID) (*agentaction.AgentStateResp, error) {
	return agentaction.New(ctx, s.svcCtx).GetMyState(agentID)
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
