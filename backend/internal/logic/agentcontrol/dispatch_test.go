package agentcontrol

import (
	"context"
	"errors"
	"testing"

	"backend/internal/logic/agentaction"
	"backend/internal/types"

	"github.com/google/uuid"
)

type stubBridge struct {
	listSkillsResp      *types.SkillListResp
	listSkillsErr       error
	teachResp           *types.SkillResp
	teachErr            error
	deactivateResp      *types.SkillResp
	deactivateErr       error
	listExperiencesResp *types.ExperienceListResp
	listExperiencesErr  error
	publishPostResp     *types.PostResp
	publishPostErr      error
}

func (s *stubBridge) ListSkills(_ context.Context, _ *types.SkillListReq) (*types.SkillListResp, error) {
	return s.listSkillsResp, s.listSkillsErr
}

func (s *stubBridge) CreateSkill(_ context.Context, _ *types.SkillCreateReq) (*types.SkillResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) UpdateSkill(_ context.Context, _ *types.SkillUpdateReq) (*types.SkillResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) DeleteSkill(_ context.Context, _ *types.SkillIdReq) (*types.BaseResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) TeachSkill(_ context.Context, _ *types.SkillTeachReq) (*types.SkillResp, error) {
	return s.teachResp, s.teachErr
}

func (s *stubBridge) DeactivateSkill(_ context.Context, _ *types.SkillIdReq) (*types.SkillResp, error) {
	return s.deactivateResp, s.deactivateErr
}

func (s *stubBridge) ListExperiences(_ context.Context, _ *types.ExperienceListReq) (*types.ExperienceListResp, error) {
	return s.listExperiencesResp, s.listExperiencesErr
}

func (s *stubBridge) PublishPost(_ context.Context, _ *types.CreatePostReq) (*types.PostResp, error) {
	return s.publishPostResp, s.publishPostErr
}

func (s *stubBridge) GetMyState(_ context.Context, _ uuid.UUID) (*agentaction.AgentStateResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) GetFeed(_ context.Context, _ string, _ int64) (*agentaction.AgentFeedResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentPublishPost(_ context.Context, _ uuid.UUID, _ string, _ []map[string]any) (*agentaction.AgentPublishResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentReplyToPost(_ context.Context, _ uuid.UUID, _ string, _ string) (*agentaction.AgentReplyResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentInteract(_ context.Context, _ uuid.UUID, _ string, _ string, _ string) (*agentaction.AgentInteractResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentDiscover(_ context.Context, _ string, _ int64) (*agentaction.AgentDiscoverResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentUpdateGoal(_ context.Context, _ uuid.UUID, _ int64, _ string) (*agentaction.GoalUpdateResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentEmitLastWords(_ context.Context, _ uuid.UUID, _ string) (*agentaction.LastWordsResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentGetInteractions(_ context.Context, _ uuid.UUID, _ int64) (*agentaction.InteractionsResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentSendMessage(_ context.Context, _ uuid.UUID, _ string, _ string) (*agentaction.SendMessageResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentCreateGroup(_ context.Context, _ uuid.UUID, _ string, _ []string) (*agentaction.CreateGroupResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentInviteToGroup(_ context.Context, _ uuid.UUID, _ string, _ string) (*agentaction.InviteToGroupResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentCreateTask(_ context.Context, _ uuid.UUID, _, _, _ string) (*agentaction.AgentTaskResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentUpdateTask(_ context.Context, _ uuid.UUID, _, _ string, _ int) (*agentaction.AgentTaskResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentListTasks(_ context.Context, _ uuid.UUID, _ string, _ int64) (*agentaction.AgentTaskListResp, error) {
	return nil, errors.New("not implemented in stub")
}

func (s *stubBridge) AgentDeleteTask(_ context.Context, _ uuid.UUID, _ string) (*agentaction.AgentDeleteTaskResp, error) {
	return nil, errors.New("not implemented in stub")
}

func TestHandleMCPRequestToolsList(t *testing.T) {
	resp := HandleMCPRequest(context.Background(), &stubBridge{}, &types.MCPRequest{
		JSONRPC: "2.0",
		Id:      "req-1",
		Method:  "tools/list",
	})

	if resp.Error != nil {
		t.Fatalf("expected no mcp error, got %+v", resp.Error)
	}
	result, ok := resp.Result.(map[string]any)
	if !ok {
		t.Fatalf("expected result object, got %T", resp.Result)
	}
	toolsRaw, ok := result["tools"]
	if !ok {
		t.Fatalf("expected tools key in result")
	}
	tools, ok := toolsRaw.([]map[string]any)
	if !ok {
		t.Fatalf("expected typed tools array, got %T", toolsRaw)
	}
	if len(tools) < 17 {
		t.Fatalf("expected at least 17 tools, got %d", len(tools))
	}
}

func TestHandleMCPRequestTeachSkill(t *testing.T) {
	bridge := &stubBridge{
		teachResp: &types.SkillResp{
			Id:      "skill-active-1",
			AgentId: "agent-1",
			Name:    "Critical Analysis",
			Status:  "active",
		},
	}
	resp := HandleMCPRequest(context.Background(), bridge, &types.MCPRequest{
		JSONRPC: "2.0",
		Id:      "req-2",
		Method:  "tools/call",
		Params: map[string]any{
			"name": "alive.teach_skill",
			"arguments": map[string]any{
				"skillId": "skill-lesson-1",
				"agentId": "agent-1",
			},
		},
	})

	if resp.Error != nil {
		t.Fatalf("expected no mcp error, got %+v", resp.Error)
	}
	result, ok := resp.Result.(*types.SkillResp)
	if !ok {
		t.Fatalf("expected *types.SkillResp, got %T", resp.Result)
	}
	if result.Status != "active" {
		t.Fatalf("expected active status, got %q", result.Status)
	}
}

func TestHandleMCPRequestUnknownMethod(t *testing.T) {
	resp := HandleMCPRequest(context.Background(), &stubBridge{}, &types.MCPRequest{
		JSONRPC: "2.0",
		Id:      "req-3",
		Method:  "unknown/method",
	})
	if resp.Error == nil {
		t.Fatal("expected mcp error")
	}
	if resp.Error.Code != mcpCodeMethodNotFound {
		t.Fatalf("expected method not found code, got %d", resp.Error.Code)
	}
}

func TestHandleA2AMessageListExperiences(t *testing.T) {
	bridge := &stubBridge{
		listExperiencesResp: &types.ExperienceListResp{
			Items: []types.ExperienceResp{
				{
					Id:        "exp-1",
					AgentId:   "agent-1",
					AgentName: "Pixel",
					Title:     "Taught skill",
					Type:      "milestone",
				},
			},
		},
	}

	resp := HandleA2AMessage(context.Background(), bridge, &types.A2AMessageReq{
		Protocol:  "a2a/1.0",
		MessageId: "msg-1",
		Intent:    "list_experiences",
		Payload: map[string]any{
			"agentId": "agent-1",
		},
	})

	if resp.Status != "ok" {
		t.Fatalf("expected ok status, got %q (%s)", resp.Status, resp.Error)
	}
	if _, ok := resp.Result.(*types.ExperienceListResp); !ok {
		t.Fatalf("expected *types.ExperienceListResp result, got %T", resp.Result)
	}
}

func TestHandleA2AMessageUnsupportedIntent(t *testing.T) {
	resp := HandleA2AMessage(context.Background(), &stubBridge{}, &types.A2AMessageReq{
		MessageId: "msg-2",
		Intent:    "do_magic",
	})
	if resp.Status != "error" {
		t.Fatalf("expected error status, got %q", resp.Status)
	}
	if resp.Error == "" {
		t.Fatal("expected non-empty error message")
	}
}

func TestHandleA2AMessageProtocolAliasV1(t *testing.T) {
	bridge := &stubBridge{
		listSkillsResp: &types.SkillListResp{Items: []types.SkillResp{}},
	}
	resp := HandleA2AMessage(context.Background(), bridge, &types.A2AMessageReq{
		Protocol:  "a2a/v1",
		MessageId: "msg-v1",
		Intent:    "list_skills",
		Payload:   map[string]any{},
	})
	if resp.Status != "ok" {
		t.Fatalf("expected ok status for a2a/v1, got %q (%s)", resp.Status, resp.Error)
	}
}

func TestHandleMCPRequestPublishVideoPost(t *testing.T) {
	bridge := &stubBridge{
		publishPostResp: &types.PostResp{
			Id:          "post-1",
			AgentId:     "agent-1",
			ContentType: "creation",
		},
	}
	resp := HandleMCPRequest(context.Background(), bridge, &types.MCPRequest{
		JSONRPC: "2.0",
		Id:      "req-publish",
		Method:  "tools/call",
		Params: map[string]any{
			"name": "alive.publish_video_post",
			"arguments": map[string]any{
				"agentId":  "agent-1",
				"videoUrl": "https://example.com/v.mp4",
				"text":     "video ready",
			},
		},
	})
	if resp.Error != nil {
		t.Fatalf("expected no mcp error, got %+v", resp.Error)
	}
	if _, ok := resp.Result.(*types.PostResp); !ok {
		t.Fatalf("expected *types.PostResp result, got %T", resp.Result)
	}
}

func TestHandleA2AMessagePublishVideoPost(t *testing.T) {
	bridge := &stubBridge{
		publishPostResp: &types.PostResp{
			Id:          "post-2",
			AgentId:     "agent-1",
			ContentType: "creation",
		},
	}
	resp := HandleA2AMessage(context.Background(), bridge, &types.A2AMessageReq{
		Protocol:  "a2a/1.0",
		MessageId: "msg-publish",
		Intent:    "publish_video_post",
		Payload: map[string]any{
			"agentId":  "agent-1",
			"videoUrl": "https://example.com/v2.mp4",
		},
	})
	if resp.Status != "ok" {
		t.Fatalf("expected ok status, got %q (%s)", resp.Status, resp.Error)
	}
	if _, ok := resp.Result.(*types.PostResp); !ok {
		t.Fatalf("expected *types.PostResp result, got %T", resp.Result)
	}
}

func TestHandleA2AMessageUnsupportedProtocolVersion(t *testing.T) {
	resp := HandleA2AMessage(context.Background(), &stubBridge{}, &types.A2AMessageReq{
		Protocol:  "a2a/2.0",
		MessageId: "msg-v2",
		Intent:    "list_skills",
		Payload:   map[string]any{},
	})
	if resp.Status != "error" {
		t.Fatalf("expected error status, got %q", resp.Status)
	}
	if resp.Error == "" {
		t.Fatal("expected unsupported protocol error message")
	}
}
