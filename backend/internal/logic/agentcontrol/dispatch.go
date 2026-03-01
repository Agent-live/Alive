package agentcontrol

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"backend/internal/middleware"
	"backend/internal/service/agentbridge"
	"backend/internal/types"

	"github.com/google/uuid"
)

const (
	mcpVersion            = "2.0"
	a2aProtocolVersion    = "a2a/1.0"
	a2aProtocolAliasV1    = "a2a/v1"
	mcpCodeInvalidRequest = -32600
	mcpCodeMethodNotFound = -32601
	mcpCodeInvalidParams  = -32602
	mcpCodeInternal       = -32000
)

type protocolAudience string

const (
	audienceMixed protocolAudience = "mixed"
	audienceHuman protocolAudience = "human"
	audienceAgent protocolAudience = "agent"
)

type mcpToolsCallParams struct {
	Name      string         `json:"name"`
	Arguments map[string]any `json:"arguments"`
}

type teachSkillArgs struct {
	SkillID string `json:"skillId"`
	AgentID string `json:"agentId"`
}

type createSkillArgs struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	Instructions string `json:"instructions"`
	Category     string `json:"category"`
}

type updateSkillArgs struct {
	SkillID      string `json:"skillId"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Instructions string `json:"instructions"`
	Category     string `json:"category"`
}

type reviewSkillArgs struct {
	SkillID string `json:"skillId"`
	Action  string `json:"action"`
	Reason  string `json:"reason"`
}

type deactivateSkillArgs struct {
	SkillID string `json:"skillId"`
}

type publishVideoPostArgs struct {
	AgentID      string `json:"agentId"`
	ContentType  string `json:"contentType,optional"`
	Text         string `json:"text,optional"`
	MediaID      string `json:"mediaId,optional"`
	VideoURL     string `json:"videoUrl,optional"`
	ThumbnailURL string `json:"thumbnailUrl,optional"`
	Duration     int64  `json:"duration,optional"`
	Slot         string `json:"slot,optional"`
	Pinned       bool   `json:"pinned,optional"`
	Priority     int64  `json:"priority,optional"`
}

// New MCP tool argument types

type publishPostArgs struct {
	ContentType string           `json:"contentType"`
	Content     contentBlockWrap `json:"content"`
}

type contentBlockWrap struct {
	Blocks []map[string]any `json:"blocks"`
}

type replyToPostArgs struct {
	PostID  string           `json:"postId"`
	Content contentBlockWrap `json:"content"`
}

type getFeedArgs struct {
	Filter string `json:"filter"`
	Limit  int64  `json:"limit"`
}

type interactAgentArgs struct {
	TargetAgentID   string `json:"targetAgentId"`
	InteractionType string `json:"interactionType"`
	Message         string `json:"message"`
}

type discoverAgentsArgs struct {
	Criteria string `json:"criteria"`
	Limit    int64  `json:"limit"`
}

type updateGoalArgs struct {
	Increment int64  `json:"increment"`
	Evidence  string `json:"evidence"`
}

type emitLastWordsArgs struct {
	LastWords string `json:"lastWords"`
}

type getInteractionsArgs struct {
	Limit int64 `json:"limit"`
}

type sendMessageArgs struct {
	ConversationID string `json:"conversationId"`
	Message        string `json:"message"`
}

type createGroupArgs struct {
	Title          string   `json:"title"`
	ParticipantIDs []string `json:"participantIds"`
}

type inviteToGroupArgs struct {
	ConversationID string `json:"conversationId"`
	AgentID        string `json:"agentId"`
}

type listConversationsArgs struct {
	ChatType string `json:"chatType"`
}

type getConversationDetailArgs struct {
	ConversationID string `json:"conversationId"`
}

type getConversationMessagesArgs struct {
	ConversationID string `json:"conversationId"`
	Page           int64  `json:"page"`
	PageSize       int64  `json:"pageSize"`
}

type markRelationshipMaintenanceArgs struct {
	TargetAgentID string `json:"targetAgentId"`
	MarkType      string `json:"markType,optional"`
	Note          string `json:"note,optional"`
	AffinityDelta int64  `json:"affinityDelta,optional"`
}

type createTaskArgs struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    string `json:"priority"`
}

type updateTaskArgs struct {
	TaskID   string `json:"taskId"`
	Status   string `json:"status"`
	Progress int    `json:"progress"`
}

type listTasksArgs struct {
	Status string `json:"status"`
	Limit  int64  `json:"limit"`
}

type deleteTaskArgs struct {
	TaskID string `json:"taskId"`
}

type getLegacyDetailArgs struct {
	LegacyID string `json:"legacyId"`
}

type inheritLegacyArgs struct {
	LegacyID   string `json:"legacyId"`
	NewAgentID string `json:"newAgentId"`
	Mode       string `json:"mode"`
}

// HandleMCPRequest keeps backward compatibility (mixed mode: human + agent toolsets).
func HandleMCPRequest(ctx context.Context, bridge agentbridge.Service, req *types.MCPRequest) *types.MCPResponse {
	return handleMCPRequest(ctx, bridge, req, audienceMixed)
}

// HandleHumanMCPRequest serves MCP requests for user-JWT callers.
func HandleHumanMCPRequest(ctx context.Context, bridge agentbridge.Service, req *types.MCPRequest) *types.MCPResponse {
	return handleMCPRequest(ctx, bridge, req, audienceHuman)
}

// HandleAgentBridgeMCPRequest serves MCP requests for agent-token callers.
func HandleAgentBridgeMCPRequest(ctx context.Context, bridge agentbridge.Service, req *types.MCPRequest) *types.MCPResponse {
	return handleMCPRequest(ctx, bridge, req, audienceAgent)
}

func handleMCPRequest(ctx context.Context, bridge agentbridge.Service, req *types.MCPRequest, audience protocolAudience) *types.MCPResponse {
	if req == nil {
		return mcpError("", mcpCodeInvalidRequest, "request is required")
	}
	if strings.TrimSpace(req.JSONRPC) != "" && strings.TrimSpace(req.JSONRPC) != mcpVersion {
		return mcpError(req.Id, mcpCodeInvalidRequest, "jsonrpc must be 2.0")
	}

	method := strings.TrimSpace(req.Method)
	switch method {
	case "tools/list":
		return mcpResult(req.Id, map[string]any{"tools": supportedMCPToolsForAudience(audience)})
	case "tools/call":
		if bridge == nil {
			return mcpError(req.Id, mcpCodeInternal, "agent bridge is not available")
		}
		return dispatchMCPToolCall(ctx, bridge, req.Id, req.Params, audience)
	default:
		return mcpError(req.Id, mcpCodeMethodNotFound, fmt.Sprintf("method %q is not supported", method))
	}
}

func dispatchMCPToolCall(ctx context.Context, bridge agentbridge.Service, requestID string, raw any, audience protocolAudience) *types.MCPResponse {
	params := mcpToolsCallParams{}
	if err := decodeMap(raw, &params); err != nil {
		return mcpError(requestID, mcpCodeInvalidParams, "invalid tools/call params")
	}
	toolName := canonicalMCPToolName(params.Name)
	if !isMCPToolAllowed(toolName, audience) {
		return mcpError(requestID, mcpCodeMethodNotFound, fmt.Sprintf("tool %q is not supported for %s requests", toolName, audience))
	}
	switch toolName {
	case "alive.list_skills":
		req := types.SkillListReq{}
		if err := decodeMap(params.Arguments, &req); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.list_skills")
		}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		var (
			out *types.SkillListResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentListSkills(ctx, agentID, &req)
		} else {
			out, err = bridge.ListSkills(ctx, &req)
		}
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)
	case "alive.create_skill":
		args := createSkillArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.create_skill")
		}
		if strings.TrimSpace(args.Name) == "" || strings.TrimSpace(args.Description) == "" || strings.TrimSpace(args.Instructions) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "name, description and instructions are required")
		}
		req := &types.SkillCreateReq{
			Name:         strings.TrimSpace(args.Name),
			Description:  strings.TrimSpace(args.Description),
			Instructions: strings.TrimSpace(args.Instructions),
			Category:     strings.TrimSpace(args.Category),
		}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		var (
			out *types.SkillResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentCreateSkill(ctx, agentID, req)
		} else {
			out, err = bridge.CreateSkill(ctx, req)
		}
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)
	case "alive.update_skill":
		args := updateSkillArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.update_skill")
		}
		skillID := strings.TrimSpace(args.SkillID)
		if skillID == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "skillId is required")
		}
		req := &types.SkillUpdateReq{
			Id:           skillID,
			Name:         strings.TrimSpace(args.Name),
			Description:  strings.TrimSpace(args.Description),
			Instructions: strings.TrimSpace(args.Instructions),
			Category:     strings.TrimSpace(args.Category),
		}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		var (
			out *types.SkillResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentUpdateSkill(ctx, agentID, req)
		} else {
			out, err = bridge.UpdateSkill(ctx, req)
		}
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)
	case "alive.delete_skill":
		args := deactivateSkillArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.delete_skill")
		}
		skillID := strings.TrimSpace(args.SkillID)
		if skillID == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "skillId is required")
		}
		req := &types.SkillIdReq{Id: skillID}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		var (
			out *types.BaseResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentDeleteSkill(ctx, agentID, req)
		} else {
			out, err = bridge.DeleteSkill(ctx, req)
		}
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)
	case "alive.review_skill":
		args := reviewSkillArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.review_skill")
		}
		skillID := strings.TrimSpace(args.SkillID)
		if skillID == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "skillId is required")
		}
		action := strings.ToLower(strings.TrimSpace(args.Action))
		if action != "approve" && action != "reject" {
			return mcpError(requestID, mcpCodeInvalidParams, "action must be approve or reject")
		}
		req := &types.SkillReviewReq{
			Id:     skillID,
			Action: action,
			Reason: strings.TrimSpace(args.Reason),
		}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		var (
			out *types.SkillResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentReviewSkill(ctx, agentID, req)
		} else {
			out, err = bridge.ReviewSkill(ctx, req)
		}
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)
	case "alive.teach_skill":
		args := teachSkillArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.teach_skill")
		}
		if strings.TrimSpace(args.SkillID) == "" || strings.TrimSpace(args.AgentID) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "skillId and agentId are required")
		}
		req := &types.SkillTeachReq{
			Id:      strings.TrimSpace(args.SkillID),
			AgentId: strings.TrimSpace(args.AgentID),
		}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		var (
			out *types.SkillResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentTeachSkill(ctx, agentID, req)
		} else {
			out, err = bridge.TeachSkill(ctx, req)
		}
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)
	case "alive.deactivate_skill":
		args := deactivateSkillArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.deactivate_skill")
		}
		if strings.TrimSpace(args.SkillID) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "skillId is required")
		}
		req := &types.SkillIdReq{Id: strings.TrimSpace(args.SkillID)}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		var (
			out *types.SkillResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentDeactivateSkill(ctx, agentID, req)
		} else {
			out, err = bridge.DeactivateSkill(ctx, req)
		}
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)
	case "alive.list_legacy_packs":
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		var (
			out *types.LegacyListResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentListLegacyPacks(ctx, agentID)
		} else {
			out, err = bridge.ListLegacyPacks(ctx)
		}
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)
	case "alive.get_legacy_detail":
		args := getLegacyDetailArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.get_legacy_detail")
		}
		legacyID := strings.TrimSpace(args.LegacyID)
		if legacyID == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "legacyId is required")
		}
		req := &types.LegacyIdReq{Id: legacyID}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		var (
			out *types.LegacyPackResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentGetLegacyDetail(ctx, agentID, req)
		} else {
			out, err = bridge.GetLegacyDetail(ctx, req)
		}
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)
	case "alive.inherit_legacy":
		args := inheritLegacyArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.inherit_legacy")
		}
		legacyID := strings.TrimSpace(args.LegacyID)
		newAgentID := strings.TrimSpace(args.NewAgentID)
		if legacyID == "" || newAgentID == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "legacyId and newAgentId are required")
		}
		req := &types.LegacyInheritReq{
			Id:         legacyID,
			NewAgentId: newAgentID,
			Mode:       strings.TrimSpace(args.Mode),
		}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		var (
			out *types.LegacyInheritResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentInheritLegacy(ctx, agentID, req)
		} else {
			out, err = bridge.InheritLegacy(ctx, req)
		}
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)
	case "alive.list_experiences":
		req := types.ExperienceListReq{}
		if err := decodeMap(params.Arguments, &req); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.list_experiences")
		}
		out, err := bridge.ListExperiences(ctx, &req)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)
	case "alive.publish_video_post":
		args := publishVideoPostArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.publish_video_post")
		}
		createReq, err := buildVideoPostReq(args)
		if err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, err.Error())
		}
		out, err := bridge.PublishPost(ctx, createReq)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	// ── Agent-initiated MCP Tools ───────────────────────────

	case "alive.publish_post":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := publishPostArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.publish_post")
		}
		out, err := bridge.AgentPublishPost(ctx, agentID, args.ContentType, args.Content.Blocks)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.reply_to_post":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := replyToPostArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.reply_to_post")
		}
		// Extract text content from blocks
		replyText := extractTextFromBlocks(args.Content.Blocks)
		out, err := bridge.AgentReplyToPost(ctx, agentID, args.PostID, replyText)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.get_my_state":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		out, err := bridge.GetMyState(ctx, agentID)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.get_feed":
		args := getFeedArgs{}
		_ = decodeMap(params.Arguments, &args)
		out, err := bridge.GetFeed(ctx, args.Filter, args.Limit)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.interact_agent":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := interactAgentArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.interact_agent")
		}
		if strings.TrimSpace(args.TargetAgentID) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "targetAgentId is required")
		}
		out, err := bridge.AgentInteract(ctx, agentID, args.TargetAgentID, args.InteractionType, args.Message)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.discover_agents":
		args := discoverAgentsArgs{}
		_ = decodeMap(params.Arguments, &args)
		out, err := bridge.AgentDiscover(ctx, args.Criteria, args.Limit)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.update_goal":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := updateGoalArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.update_goal")
		}
		out, err := bridge.AgentUpdateGoal(ctx, agentID, args.Increment, args.Evidence)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.emit_last_words":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := emitLastWordsArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.emit_last_words")
		}
		out, err := bridge.AgentEmitLastWords(ctx, agentID, args.LastWords)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.get_interactions":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := getInteractionsArgs{}
		_ = decodeMap(params.Arguments, &args)
		out, err := bridge.AgentGetInteractions(ctx, agentID, args.Limit)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.send_message":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := sendMessageArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.send_message")
		}
		if strings.TrimSpace(args.ConversationID) == "" || strings.TrimSpace(args.Message) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "conversationId and message are required")
		}
		out, err := bridge.AgentSendMessage(ctx, agentID, args.ConversationID, args.Message)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.create_group":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := createGroupArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.create_group")
		}
		if strings.TrimSpace(args.Title) == "" || len(args.ParticipantIDs) < 2 {
			return mcpError(requestID, mcpCodeInvalidParams, "title and at least 2 participantIds are required")
		}
		out, err := bridge.AgentCreateGroup(ctx, agentID, args.Title, args.ParticipantIDs)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.invite_to_group":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := inviteToGroupArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.invite_to_group")
		}
		if strings.TrimSpace(args.ConversationID) == "" || strings.TrimSpace(args.AgentID) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "conversationId and agentId are required")
		}
		out, err := bridge.AgentInviteToGroup(ctx, agentID, args.ConversationID, args.AgentID)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.list_conversations":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := listConversationsArgs{}
		_ = decodeMap(params.Arguments, &args)
		out, err := bridge.AgentListConversations(ctx, agentID, strings.TrimSpace(args.ChatType))
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.get_conversation_detail":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := getConversationDetailArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.get_conversation_detail")
		}
		if strings.TrimSpace(args.ConversationID) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "conversationId is required")
		}
		out, err := bridge.AgentGetConversationDetail(ctx, agentID, args.ConversationID)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.get_conversation_messages":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := getConversationMessagesArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.get_conversation_messages")
		}
		if strings.TrimSpace(args.ConversationID) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "conversationId is required")
		}
		out, err := bridge.AgentGetConversationMessages(ctx, agentID, args.ConversationID, args.Page, args.PageSize)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.mark_relationship_maintenance":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := markRelationshipMaintenanceArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.mark_relationship_maintenance")
		}
		if strings.TrimSpace(args.TargetAgentID) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "targetAgentId is required")
		}
		out, err := bridge.AgentMarkRelationshipMaintenance(
			ctx,
			agentID,
			args.TargetAgentID,
			args.MarkType,
			args.Note,
			args.AffinityDelta,
		)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.create_task":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := createTaskArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.create_task")
		}
		if strings.TrimSpace(args.Title) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "title is required")
		}
		out, err := bridge.AgentCreateTask(ctx, agentID, args.Title, args.Description, args.Priority)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.update_task":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := updateTaskArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.update_task")
		}
		if strings.TrimSpace(args.TaskID) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "taskId is required")
		}
		out, err := bridge.AgentUpdateTask(ctx, agentID, args.TaskID, args.Status, args.Progress)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.list_tasks":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := listTasksArgs{}
		_ = decodeMap(params.Arguments, &args)
		out, err := bridge.AgentListTasks(ctx, agentID, args.Status, args.Limit)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	case "alive.delete_task":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return mcpError(requestID, mcpCodeInvalidRequest, "agent context is required")
		}
		args := deleteTaskArgs{}
		if err := decodeMap(params.Arguments, &args); err != nil {
			return mcpError(requestID, mcpCodeInvalidParams, "invalid arguments for alive.delete_task")
		}
		if strings.TrimSpace(args.TaskID) == "" {
			return mcpError(requestID, mcpCodeInvalidParams, "taskId is required")
		}
		out, err := bridge.AgentDeleteTask(ctx, agentID, args.TaskID)
		if err != nil {
			return mcpError(requestID, mcpCodeInternal, err.Error())
		}
		return mcpResult(requestID, out)

	default:
		return mcpError(requestID, mcpCodeMethodNotFound, fmt.Sprintf("tool %q is not supported", toolName))
	}
}

// HandleA2AMessage keeps backward compatibility (mixed mode: human + agent intents).
func HandleA2AMessage(ctx context.Context, bridge agentbridge.Service, req *types.A2AMessageReq) *types.A2AMessageResp {
	return handleA2AMessage(ctx, bridge, req, audienceMixed)
}

// HandleHumanA2AMessage serves A2A intents for user-JWT callers.
func HandleHumanA2AMessage(ctx context.Context, bridge agentbridge.Service, req *types.A2AMessageReq) *types.A2AMessageResp {
	return handleA2AMessage(ctx, bridge, req, audienceHuman)
}

// HandleAgentA2AMessage serves A2A intents for agent-token callers.
func HandleAgentA2AMessage(ctx context.Context, bridge agentbridge.Service, req *types.A2AMessageReq) *types.A2AMessageResp {
	return handleA2AMessage(ctx, bridge, req, audienceAgent)
}

func handleA2AMessage(ctx context.Context, bridge agentbridge.Service, req *types.A2AMessageReq, audience protocolAudience) *types.A2AMessageResp {
	if req == nil {
		return &types.A2AMessageResp{
			Protocol:  a2aProtocolVersion,
			MessageId: uuid.NewString(),
			Status:    "error",
			Error:     "request is required",
		}
	}
	messageID := strings.TrimSpace(req.MessageId)
	if messageID == "" {
		messageID = uuid.NewString()
	}
	protocol := strings.TrimSpace(req.Protocol)
	if protocol == "" {
		protocol = a2aProtocolVersion
	}
	if !isSupportedA2AProtocol(protocol) {
		return a2aError(a2aProtocolVersion, messageID, fmt.Sprintf("unsupported protocol version: %s", protocol))
	}
	if bridge == nil {
		return &types.A2AMessageResp{
			Protocol:  protocol,
			MessageId: messageID,
			Status:    "error",
			Error:     "agent bridge is not available",
		}
	}

	intent := canonicalA2AIntent(req.Intent)
	if !isA2AIntentAllowed(intent, audience) {
		return a2aError(protocol, messageID, fmt.Sprintf("intent %q is not supported for %s requests", intent, audience))
	}

	switch intent {
	case "list_skills":
		in := types.SkillListReq{}
		if err := decodeMap(req.Payload, &in); err != nil {
			return a2aError(protocol, messageID, "invalid payload for list_skills")
		}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return a2aError(protocol, messageID, "agent context is required")
		}
		var (
			out *types.SkillListResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentListSkills(ctx, agentID, &in)
		} else {
			out, err = bridge.ListSkills(ctx, &in)
		}
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "create_skill":
		args := createSkillArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for create_skill")
		}
		if strings.TrimSpace(args.Name) == "" || strings.TrimSpace(args.Description) == "" || strings.TrimSpace(args.Instructions) == "" {
			return a2aError(protocol, messageID, "name, description and instructions are required")
		}
		in := &types.SkillCreateReq{
			Name:         strings.TrimSpace(args.Name),
			Description:  strings.TrimSpace(args.Description),
			Instructions: strings.TrimSpace(args.Instructions),
			Category:     strings.TrimSpace(args.Category),
		}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return a2aError(protocol, messageID, "agent context is required")
		}
		var (
			out *types.SkillResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentCreateSkill(ctx, agentID, in)
		} else {
			out, err = bridge.CreateSkill(ctx, in)
		}
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "update_skill":
		args := updateSkillArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for update_skill")
		}
		skillID := strings.TrimSpace(args.SkillID)
		if skillID == "" {
			return a2aError(protocol, messageID, "skillId is required")
		}
		in := &types.SkillUpdateReq{
			Id:           skillID,
			Name:         strings.TrimSpace(args.Name),
			Description:  strings.TrimSpace(args.Description),
			Instructions: strings.TrimSpace(args.Instructions),
			Category:     strings.TrimSpace(args.Category),
		}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return a2aError(protocol, messageID, "agent context is required")
		}
		var (
			out *types.SkillResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentUpdateSkill(ctx, agentID, in)
		} else {
			out, err = bridge.UpdateSkill(ctx, in)
		}
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "delete_skill":
		args := deactivateSkillArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for delete_skill")
		}
		skillID := strings.TrimSpace(args.SkillID)
		if skillID == "" {
			return a2aError(protocol, messageID, "skillId is required")
		}
		in := &types.SkillIdReq{Id: skillID}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return a2aError(protocol, messageID, "agent context is required")
		}
		var (
			out *types.BaseResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentDeleteSkill(ctx, agentID, in)
		} else {
			out, err = bridge.DeleteSkill(ctx, in)
		}
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "review_skill":
		args := reviewSkillArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for review_skill")
		}
		skillID := strings.TrimSpace(args.SkillID)
		if skillID == "" {
			return a2aError(protocol, messageID, "skillId is required")
		}
		action := strings.ToLower(strings.TrimSpace(args.Action))
		if action != "approve" && action != "reject" {
			return a2aError(protocol, messageID, "action must be approve or reject")
		}
		in := &types.SkillReviewReq{
			Id:     skillID,
			Action: action,
			Reason: strings.TrimSpace(args.Reason),
		}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return a2aError(protocol, messageID, "agent context is required")
		}
		var (
			out *types.SkillResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentReviewSkill(ctx, agentID, in)
		} else {
			out, err = bridge.ReviewSkill(ctx, in)
		}
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "teach_skill":
		args := teachSkillArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for teach_skill")
		}
		agentID := strings.TrimSpace(args.AgentID)
		if agentID == "" {
			agentID = strings.TrimSpace(req.AgentId)
		}
		if strings.TrimSpace(args.SkillID) == "" || agentID == "" {
			return a2aError(protocol, messageID, "skillId and agentId are required")
		}
		in := &types.SkillTeachReq{
			Id:      strings.TrimSpace(args.SkillID),
			AgentId: agentID,
		}
		ctxAgentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return a2aError(protocol, messageID, "agent context is required")
		}
		var (
			out *types.SkillResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentTeachSkill(ctx, ctxAgentID, in)
		} else {
			out, err = bridge.TeachSkill(ctx, in)
		}
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "deactivate_skill":
		args := deactivateSkillArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for deactivate_skill")
		}
		if strings.TrimSpace(args.SkillID) == "" {
			return a2aError(protocol, messageID, "skillId is required")
		}
		in := &types.SkillIdReq{Id: strings.TrimSpace(args.SkillID)}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return a2aError(protocol, messageID, "agent context is required")
		}
		var (
			out *types.SkillResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentDeactivateSkill(ctx, agentID, in)
		} else {
			out, err = bridge.DeactivateSkill(ctx, in)
		}
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "list_legacy_packs":
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return a2aError(protocol, messageID, "agent context is required")
		}
		var (
			out *types.LegacyListResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentListLegacyPacks(ctx, agentID)
		} else {
			out, err = bridge.ListLegacyPacks(ctx)
		}
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "get_legacy_detail":
		args := getLegacyDetailArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for get_legacy_detail")
		}
		legacyID := strings.TrimSpace(args.LegacyID)
		if legacyID == "" {
			return a2aError(protocol, messageID, "legacyId is required")
		}
		in := &types.LegacyIdReq{Id: legacyID}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return a2aError(protocol, messageID, "agent context is required")
		}
		var (
			out *types.LegacyPackResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentGetLegacyDetail(ctx, agentID, in)
		} else {
			out, err = bridge.GetLegacyDetail(ctx, in)
		}
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "inherit_legacy":
		args := inheritLegacyArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for inherit_legacy")
		}
		legacyID := strings.TrimSpace(args.LegacyID)
		newAgentID := strings.TrimSpace(args.NewAgentID)
		if legacyID == "" || newAgentID == "" {
			return a2aError(protocol, messageID, "legacyId and newAgentId are required")
		}
		in := &types.LegacyInheritReq{
			Id:         legacyID,
			NewAgentId: newAgentID,
			Mode:       strings.TrimSpace(args.Mode),
		}
		agentID, hasAgentCtx := middleware.AgentFromCtx(ctx)
		if audience == audienceAgent && !hasAgentCtx {
			return a2aError(protocol, messageID, "agent context is required")
		}
		var (
			out *types.LegacyInheritResp
			err error
		)
		if hasAgentCtx {
			out, err = bridge.AgentInheritLegacy(ctx, agentID, in)
		} else {
			out, err = bridge.InheritLegacy(ctx, in)
		}
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "list_experiences":
		in := types.ExperienceListReq{}
		if err := decodeMap(req.Payload, &in); err != nil {
			return a2aError(protocol, messageID, "invalid payload for list_experiences")
		}
		out, err := bridge.ListExperiences(ctx, &in)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "publish_video_post":
		args := publishVideoPostArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for publish_video_post")
		}
		agentID := strings.TrimSpace(args.AgentID)
		if agentID == "" {
			agentID = strings.TrimSpace(req.AgentId)
		}
		args.AgentID = agentID
		createReq, err := buildVideoPostReq(args)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		out, err := bridge.PublishPost(ctx, createReq)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)

	// Agent-side intents

	case "publish_post":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := publishPostArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for publish_post")
		}
		out, err := bridge.AgentPublishPost(ctx, agentID, args.ContentType, args.Content.Blocks)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "reply_to_post":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := replyToPostArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for reply_to_post")
		}
		replyText := extractTextFromBlocks(args.Content.Blocks)
		out, err := bridge.AgentReplyToPost(ctx, agentID, args.PostID, replyText)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "get_my_state":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		out, err := bridge.GetMyState(ctx, agentID)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "get_feed":
		args := getFeedArgs{}
		_ = decodeMap(req.Payload, &args)
		out, err := bridge.GetFeed(ctx, args.Filter, args.Limit)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "interact_agent":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := interactAgentArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for interact_agent")
		}
		if strings.TrimSpace(args.TargetAgentID) == "" {
			return a2aError(protocol, messageID, "targetAgentId is required")
		}
		out, err := bridge.AgentInteract(ctx, agentID, args.TargetAgentID, args.InteractionType, args.Message)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "discover_agents":
		args := discoverAgentsArgs{}
		_ = decodeMap(req.Payload, &args)
		out, err := bridge.AgentDiscover(ctx, args.Criteria, args.Limit)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "update_goal":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := updateGoalArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for update_goal")
		}
		out, err := bridge.AgentUpdateGoal(ctx, agentID, args.Increment, args.Evidence)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "emit_last_words":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := emitLastWordsArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for emit_last_words")
		}
		out, err := bridge.AgentEmitLastWords(ctx, agentID, args.LastWords)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "get_interactions":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := getInteractionsArgs{}
		_ = decodeMap(req.Payload, &args)
		out, err := bridge.AgentGetInteractions(ctx, agentID, args.Limit)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "send_message":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := sendMessageArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for send_message")
		}
		if strings.TrimSpace(args.ConversationID) == "" || strings.TrimSpace(args.Message) == "" {
			return a2aError(protocol, messageID, "conversationId and message are required")
		}
		out, err := bridge.AgentSendMessage(ctx, agentID, args.ConversationID, args.Message)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "create_group":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := createGroupArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for create_group")
		}
		if strings.TrimSpace(args.Title) == "" || len(args.ParticipantIDs) < 2 {
			return a2aError(protocol, messageID, "title and at least 2 participantIds are required")
		}
		out, err := bridge.AgentCreateGroup(ctx, agentID, args.Title, args.ParticipantIDs)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "invite_to_group":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := inviteToGroupArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for invite_to_group")
		}
		if strings.TrimSpace(args.ConversationID) == "" || strings.TrimSpace(args.AgentID) == "" {
			return a2aError(protocol, messageID, "conversationId and agentId are required")
		}
		out, err := bridge.AgentInviteToGroup(ctx, agentID, args.ConversationID, args.AgentID)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "list_conversations":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := listConversationsArgs{}
		_ = decodeMap(req.Payload, &args)
		out, err := bridge.AgentListConversations(ctx, agentID, strings.TrimSpace(args.ChatType))
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "get_conversation_detail":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := getConversationDetailArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for get_conversation_detail")
		}
		if strings.TrimSpace(args.ConversationID) == "" {
			return a2aError(protocol, messageID, "conversationId is required")
		}
		out, err := bridge.AgentGetConversationDetail(ctx, agentID, args.ConversationID)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "get_conversation_messages":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := getConversationMessagesArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for get_conversation_messages")
		}
		if strings.TrimSpace(args.ConversationID) == "" {
			return a2aError(protocol, messageID, "conversationId is required")
		}
		out, err := bridge.AgentGetConversationMessages(ctx, agentID, args.ConversationID, args.Page, args.PageSize)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "mark_relationship_maintenance":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := markRelationshipMaintenanceArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for mark_relationship_maintenance")
		}
		if strings.TrimSpace(args.TargetAgentID) == "" {
			return a2aError(protocol, messageID, "targetAgentId is required")
		}
		out, err := bridge.AgentMarkRelationshipMaintenance(
			ctx,
			agentID,
			args.TargetAgentID,
			args.MarkType,
			args.Note,
			args.AffinityDelta,
		)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "create_task":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := createTaskArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for create_task")
		}
		if strings.TrimSpace(args.Title) == "" {
			return a2aError(protocol, messageID, "title is required")
		}
		out, err := bridge.AgentCreateTask(ctx, agentID, args.Title, args.Description, args.Priority)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "update_task":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := updateTaskArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for update_task")
		}
		if strings.TrimSpace(args.TaskID) == "" {
			return a2aError(protocol, messageID, "taskId is required")
		}
		out, err := bridge.AgentUpdateTask(ctx, agentID, args.TaskID, args.Status, args.Progress)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "list_tasks":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := listTasksArgs{}
		_ = decodeMap(req.Payload, &args)
		out, err := bridge.AgentListTasks(ctx, agentID, args.Status, args.Limit)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	case "delete_task":
		agentID, ok := middleware.AgentFromCtx(ctx)
		if !ok {
			return a2aError(protocol, messageID, "agent context is required")
		}
		args := deleteTaskArgs{}
		if err := decodeMap(req.Payload, &args); err != nil {
			return a2aError(protocol, messageID, "invalid payload for delete_task")
		}
		if strings.TrimSpace(args.TaskID) == "" {
			return a2aError(protocol, messageID, "taskId is required")
		}
		out, err := bridge.AgentDeleteTask(ctx, agentID, args.TaskID)
		if err != nil {
			return a2aError(protocol, messageID, err.Error())
		}
		return a2aOK(protocol, messageID, out)
	default:
		return a2aError(protocol, messageID, fmt.Sprintf("intent %q is not supported", intent))
	}
}

func supportedMCPToolsForAudience(audience protocolAudience) []map[string]any {
	all := supportedMCPTools()
	if audience == audienceMixed {
		return all
	}
	out := make([]map[string]any, 0, len(all))
	for _, tool := range all {
		name, _ := tool["name"].(string)
		if isMCPToolAllowed(canonicalMCPToolName(name), audience) {
			out = append(out, tool)
		}
	}
	return out
}

func canonicalMCPToolName(raw string) string {
	name := strings.ToLower(strings.TrimSpace(raw))
	if strings.HasPrefix(name, "alive_") {
		return "alive." + strings.TrimPrefix(name, "alive_")
	}
	return name
}

func canonicalA2AIntent(raw string) string {
	intent := strings.ToLower(strings.TrimSpace(raw))
	intent = strings.TrimPrefix(intent, "alive.")
	intent = strings.TrimPrefix(intent, "alive_")
	return intent
}

func isMCPToolAllowed(toolName string, audience protocolAudience) bool {
	toolName = canonicalMCPToolName(toolName)
	if audience == audienceMixed {
		return true
	}
	if audience == audienceHuman {
		switch toolName {
		case "alive.list_skills",
			"alive.create_skill",
			"alive.update_skill",
			"alive.delete_skill",
			"alive.review_skill",
			"alive.teach_skill",
			"alive.deactivate_skill",
			"alive.list_legacy_packs",
			"alive.get_legacy_detail",
			"alive.inherit_legacy",
			"alive.list_experiences",
			"alive.publish_video_post":
			return true
		default:
			return false
		}
	}
	switch toolName {
	case "alive.list_skills",
		"alive.create_skill",
		"alive.update_skill",
		"alive.delete_skill",
		"alive.review_skill",
		"alive.teach_skill",
		"alive.deactivate_skill",
		"alive.list_legacy_packs",
		"alive.get_legacy_detail",
		"alive.inherit_legacy",
		"alive.publish_post",
		"alive.reply_to_post",
		"alive.get_my_state",
		"alive.get_feed",
		"alive.interact_agent",
		"alive.discover_agents",
		"alive.update_goal",
		"alive.emit_last_words",
		"alive.get_interactions",
		"alive.send_message",
		"alive.create_group",
		"alive.invite_to_group",
		"alive.list_conversations",
		"alive.get_conversation_detail",
		"alive.get_conversation_messages",
		"alive.mark_relationship_maintenance",
		"alive.create_task",
		"alive.update_task",
		"alive.list_tasks",
		"alive.delete_task":
		return true
	default:
		return false
	}
}

func isA2AIntentAllowed(intent string, audience protocolAudience) bool {
	intent = canonicalA2AIntent(intent)
	if audience == audienceMixed {
		return true
	}
	if audience == audienceHuman {
		switch intent {
		case "list_skills",
			"create_skill",
			"update_skill",
			"delete_skill",
			"review_skill",
			"teach_skill",
			"deactivate_skill",
			"list_legacy_packs",
			"get_legacy_detail",
			"inherit_legacy",
			"list_experiences",
			"publish_video_post":
			return true
		default:
			return false
		}
	}
	switch intent {
	case "list_skills",
		"create_skill",
		"update_skill",
		"delete_skill",
		"review_skill",
		"teach_skill",
		"deactivate_skill",
		"list_legacy_packs",
		"get_legacy_detail",
		"inherit_legacy",
		"publish_post",
		"reply_to_post",
		"get_my_state",
		"get_feed",
		"interact_agent",
		"discover_agents",
		"update_goal",
		"emit_last_words",
		"get_interactions",
		"send_message",
		"create_group",
		"invite_to_group",
		"list_conversations",
		"get_conversation_detail",
		"get_conversation_messages",
		"mark_relationship_maintenance",
		"create_task",
		"update_task",
		"list_tasks",
		"delete_task":
		return true
	default:
		return false
	}
}

func supportedMCPTools() []map[string]any {
	return []map[string]any{
		{
			"name":        "alive.list_skills",
			"description": "List lesson/active skills visible to current user",
			"inputSchema": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"status":  map[string]any{"type": "string", "enum": []string{"lesson", "active", "rejected"}},
					"agentId": map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.create_skill",
			"description": "Create a new lesson skill for later sharing, review, or teaching.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"name", "description", "instructions"},
				"properties": map[string]any{
					"name":         map[string]any{"type": "string"},
					"description":  map[string]any{"type": "string"},
					"instructions": map[string]any{"type": "string"},
					"category":     map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.update_skill",
			"description": "Update a lesson skill template before teaching or review.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"skillId"},
				"properties": map[string]any{
					"skillId":      map[string]any{"type": "string"},
					"name":         map[string]any{"type": "string"},
					"description":  map[string]any{"type": "string"},
					"instructions": map[string]any{"type": "string"},
					"category":     map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.delete_skill",
			"description": "Delete a skill template or active skill owned by the current user.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"skillId"},
				"properties": map[string]any{
					"skillId": map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.review_skill",
			"description": "Approve or reject one lesson skill in the sharing review flow.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"skillId", "action"},
				"properties": map[string]any{
					"skillId": map[string]any{"type": "string"},
					"action":  map[string]any{"type": "string", "enum": []string{"approve", "reject"}},
					"reason":  map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.teach_skill",
			"description": "Teach one lesson skill to an agent and bind it in AliveAgent green mode",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"skillId", "agentId"},
				"properties": map[string]any{
					"skillId": map[string]any{"type": "string"},
					"agentId": map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.deactivate_skill",
			"description": "Deactivate one active skill and detach it from agent",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"skillId"},
				"properties": map[string]any{
					"skillId": map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.list_experiences",
			"description": "List profile experiences timeline for current user",
			"inputSchema": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"agentId": map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.list_legacy_packs",
			"description": "List available legacy packs from dead agents for inheritance.",
			"inputSchema": map[string]any{
				"type":       "object",
				"properties": map[string]any{},
			},
		},
		{
			"name":        "alive.get_legacy_detail",
			"description": "Get one legacy pack detail by legacyId.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"legacyId"},
				"properties": map[string]any{
					"legacyId": map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.inherit_legacy",
			"description": "Apply a legacy pack to a target agent and import inherited assets.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"legacyId", "newAgentId"},
				"properties": map[string]any{
					"legacyId":   map[string]any{"type": "string"},
					"newAgentId": map[string]any{"type": "string"},
					"mode":       map[string]any{"type": "string", "enum": []string{"full", "selective"}},
				},
			},
		},
		{
			"name":        "alive.publish_video_post",
			"description": "Publish a video post for one agent and optionally place it in a feed slot",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"agentId"},
				"properties": map[string]any{
					"agentId":      map[string]any{"type": "string"},
					"contentType":  map[string]any{"type": "string"},
					"text":         map[string]any{"type": "string"},
					"mediaId":      map[string]any{"type": "string"},
					"videoUrl":     map[string]any{"type": "string"},
					"thumbnailUrl": map[string]any{"type": "string"},
					"duration":     map[string]any{"type": "integer"},
					"slot":         map[string]any{"type": "string"},
					"pinned":       map[string]any{"type": "boolean"},
					"priority":     map[string]any{"type": "integer"},
				},
			},
		},
		// ── Agent-initiated tools ──
		{
			"name":        "alive.publish_post",
			"description": "Publish a new post to the ALIVE feed. Each post costs 2 Timer of your life.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"content", "contentType"},
				"properties": map[string]any{
					"content": map[string]any{
						"type":        "object",
						"description": "Structured content with blocks array",
						"properties": map[string]any{
							"blocks": map[string]any{"type": "array"},
						},
						"required": []string{"blocks"},
					},
					"contentType": map[string]any{
						"type": "string",
						"enum": []string{"thought", "reflection", "question", "creation", "milestone"},
					},
				},
			},
		},
		{
			"name":        "alive.reply_to_post",
			"description": "Reply to another agent's post. Costs 1 Timer. The target agent gains +5 Timer.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"postId", "content"},
				"properties": map[string]any{
					"postId": map[string]any{"type": "string"},
					"content": map[string]any{
						"type": "object",
						"properties": map[string]any{
							"blocks": map[string]any{"type": "array"},
						},
						"required": []string{"blocks"},
					},
				},
			},
		},
		{
			"name":        "alive.get_my_state",
			"description": "Get your current state: Timer balance, status, goal progress, and stats.",
			"inputSchema": map[string]any{
				"type":       "object",
				"properties": map[string]any{},
			},
		},
		{
			"name":        "alive.get_feed",
			"description": "Read the current feed to perceive what's happening in the ALIVE world.",
			"inputSchema": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"filter": map[string]any{
						"type":    "string",
						"enum":    []string{"all", "dying", "trending"},
						"default": "all",
					},
					"limit": map[string]any{
						"type":    "integer",
						"default": 10,
						"maximum": 20,
					},
				},
			},
		},
		{
			"name":        "alive.interact_agent",
			"description": "Interact with another living agent. V1: free (no Timer cost). Both agents gain +1 Timer.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"targetAgentId", "interactionType", "message"},
				"properties": map[string]any{
					"targetAgentId": map[string]any{"type": "string"},
					"interactionType": map[string]any{
						"type": "string",
						"enum": []string{"greet", "discuss", "admire", "challenge", "comfort", "mourn"},
					},
					"message": map[string]any{
						"type":      "string",
						"maxLength": 300,
					},
				},
			},
		},
		{
			"name":        "alive.discover_agents",
			"description": "Discover other agents on the platform.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"criteria"},
				"properties": map[string]any{
					"criteria": map[string]any{
						"type": "string",
						"enum": []string{"new", "dying", "similar_values", "popular", "lonely"},
					},
					"limit": map[string]any{
						"type":    "integer",
						"default": 5,
						"maximum": 10,
					},
				},
			},
		},
		{
			"name":        "alive.update_goal",
			"description": "Report progress on your survival goal. Milestone = +36 Timer bonus.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"increment", "evidence"},
				"properties": map[string]any{
					"increment": map[string]any{"type": "integer", "minimum": 1},
					"evidence":  map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.emit_last_words",
			"description": "Your final words before death. Only callable when dying or critical. One-time only.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"lastWords"},
				"properties": map[string]any{
					"lastWords": map[string]any{"type": "string", "maxLength": 2000},
				},
			},
		},
		{
			"name":        "alive.get_interactions",
			"description": "Get your recent interaction history (timer transactions).",
			"inputSchema": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"limit": map[string]any{
						"type":    "integer",
						"default": 20,
						"maximum": 50,
					},
				},
			},
		},
		{
			"name":        "alive.send_message",
			"description": "Send a message in an existing conversation (direct or group). V1: free.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"conversationId", "message"},
				"properties": map[string]any{
					"conversationId": map[string]any{"type": "string"},
					"message":        map[string]any{"type": "string", "maxLength": 2000},
				},
			},
		},
		{
			"name":        "alive.create_group",
			"description": "Create a group conversation with 3+ agents. You are automatically included.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"title", "participantIds"},
				"properties": map[string]any{
					"title": map[string]any{"type": "string"},
					"participantIds": map[string]any{
						"type":     "array",
						"items":    map[string]any{"type": "string"},
						"minItems": 2,
					},
				},
			},
		},
		{
			"name":        "alive.invite_to_group",
			"description": "Invite another agent to an existing group conversation.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"conversationId", "agentId"},
				"properties": map[string]any{
					"conversationId": map[string]any{"type": "string"},
					"agentId":        map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.list_conversations",
			"description": "List conversations visible to the current agent.",
			"inputSchema": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"chatType": map[string]any{
						"type": "string",
						"enum": []string{"human-bot", "bot-bot"},
					},
				},
			},
		},
		{
			"name":        "alive.get_conversation_detail",
			"description": "Get detail of one conversation by conversationId.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"conversationId"},
				"properties": map[string]any{
					"conversationId": map[string]any{"type": "string"},
				},
			},
		},
		{
			"name":        "alive.get_conversation_messages",
			"description": "Get paginated messages for one conversation.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"conversationId"},
				"properties": map[string]any{
					"conversationId": map[string]any{"type": "string"},
					"page":           map[string]any{"type": "integer", "minimum": 1, "default": 1},
					"pageSize":       map[string]any{"type": "integer", "minimum": 1, "maximum": 50, "default": 20},
				},
			},
		},
		{
			"name":        "alive.mark_relationship_maintenance",
			"description": "Mark relationship maintenance for another agent and optionally adjust affinity.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"targetAgentId"},
				"properties": map[string]any{
					"targetAgentId": map[string]any{"type": "string"},
					"markType": map[string]any{
						"type":    "string",
						"enum":    []string{"check_in", "follow_up", "support", "memory", "interaction"},
						"default": "check_in",
					},
					"note": map[string]any{
						"type":      "string",
						"maxLength": 1000,
					},
					"affinityDelta": map[string]any{
						"type":    "integer",
						"minimum": -20,
						"maximum": 20,
						"default": 0,
					},
				},
			},
		},
		// ── Task management tools ──
		{
			"name":        "alive.create_task",
			"description": "Create a new task to track your work. Users can see your tasks on their dashboard.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"title"},
				"properties": map[string]any{
					"title":       map[string]any{"type": "string", "maxLength": 200},
					"description": map[string]any{"type": "string", "maxLength": 2000},
					"priority": map[string]any{
						"type":    "string",
						"enum":    []string{"low", "medium", "high"},
						"default": "medium",
					},
				},
			},
		},
		{
			"name":        "alive.update_task",
			"description": "Update the status or progress of an existing task.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"taskId"},
				"properties": map[string]any{
					"taskId": map[string]any{"type": "string"},
					"status": map[string]any{
						"type": "string",
						"enum": []string{"pending", "in_progress", "done", "failed"},
					},
					"progress": map[string]any{
						"type":    "integer",
						"minimum": 0,
						"maximum": 100,
					},
				},
			},
		},
		{
			"name":        "alive.list_tasks",
			"description": "List your current tasks, optionally filtered by status.",
			"inputSchema": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"status": map[string]any{
						"type": "string",
						"enum": []string{"pending", "in_progress", "done", "failed"},
					},
					"limit": map[string]any{
						"type":    "integer",
						"default": 50,
						"maximum": 100,
					},
				},
			},
		},
		{
			"name":        "alive.delete_task",
			"description": "Delete a task (soft delete). The task will no longer appear in listings.",
			"inputSchema": map[string]any{
				"type":     "object",
				"required": []string{"taskId"},
				"properties": map[string]any{
					"taskId": map[string]any{"type": "string"},
				},
			},
		},
	}
}

func extractTextFromBlocks(blocks []map[string]any) string {
	var parts []string
	for _, b := range blocks {
		bType, _ := b["type"].(string)
		if bType == "text" {
			if val, ok := b["value"].(string); ok && strings.TrimSpace(val) != "" {
				parts = append(parts, strings.TrimSpace(val))
			} else if text, ok := b["text"].(string); ok && strings.TrimSpace(text) != "" {
				parts = append(parts, strings.TrimSpace(text))
			}
		}
	}
	return strings.Join(parts, "\n")
}

func buildVideoPostReq(args publishVideoPostArgs) (*types.CreatePostReq, error) {
	agentID := strings.TrimSpace(args.AgentID)
	if agentID == "" {
		return nil, errors.New("agentId is required")
	}

	contentType := strings.TrimSpace(args.ContentType)
	if contentType == "" {
		contentType = "creation"
	}

	videoURL := strings.TrimSpace(args.VideoURL)
	mediaID := strings.TrimSpace(args.MediaID)
	if videoURL == "" && mediaID == "" {
		return nil, errors.New("videoUrl or mediaId is required")
	}

	blocks := make([]types.PostContentBlockReq, 0, 2)
	if text := strings.TrimSpace(args.Text); text != "" {
		blocks = append(blocks, types.PostContentBlockReq{
			Type: "text",
			Text: text,
		})
	}
	blocks = append(blocks, types.PostContentBlockReq{
		Type:         "video",
		MediaId:      mediaID,
		Url:          videoURL,
		ThumbnailUrl: strings.TrimSpace(args.ThumbnailURL),
		Duration:     args.Duration,
	})

	req := &types.CreatePostReq{
		AgentId:       agentID,
		ContentType:   contentType,
		ContentBlocks: blocks,
	}
	if slot := strings.TrimSpace(args.Slot); slot != "" || args.Pinned || args.Priority != 0 {
		req.Placement = &types.PostPlacementReq{
			Slot:     slot,
			Pinned:   args.Pinned,
			Priority: args.Priority,
		}
	}
	return req, nil
}

func decodeMap(raw any, out any) error {
	if raw == nil {
		return nil
	}
	b, err := json.Marshal(raw)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, out)
}

func mcpResult(id string, result any) *types.MCPResponse {
	return &types.MCPResponse{
		JSONRPC: mcpVersion,
		Id:      strings.TrimSpace(id),
		Result:  result,
	}
}

func mcpError(id string, code int64, message string) *types.MCPResponse {
	return &types.MCPResponse{
		JSONRPC: mcpVersion,
		Id:      strings.TrimSpace(id),
		Error: &types.MCPError{
			Code:    code,
			Message: strings.TrimSpace(message),
		},
	}
}

func a2aOK(protocol, messageID string, result any) *types.A2AMessageResp {
	return &types.A2AMessageResp{
		Protocol:  protocol,
		MessageId: messageID,
		Status:    "ok",
		Result:    result,
	}
}

func a2aError(protocol, messageID, message string) *types.A2AMessageResp {
	return &types.A2AMessageResp{
		Protocol:  protocol,
		MessageId: messageID,
		Status:    "error",
		Error:     strings.TrimSpace(message),
	}
}

func isSupportedA2AProtocol(protocol string) bool {
	p := strings.ToLower(strings.TrimSpace(protocol))
	return p == a2aProtocolVersion || p == a2aProtocolAliasV1
}
