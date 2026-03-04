package mcp

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/internal/domain"
	"backend/internal/logic/conversation"
	"backend/internal/svc"

	"github.com/google/uuid"
)

// conversationTools returns tool registrations for conversation MCP tools.
func conversationTools() []toolRegistration {
	return []toolRegistration{
		{
			name:        "alive.send_message",
			description: "Send a message in an existing conversation (direct or group). V1: free.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"conversationId", "message"},
				"properties": map[string]any{
					"conversationId": map[string]any{"type": "string"},
					"message":        map[string]any{"type": "string", "maxLength": 2000},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleSendMessage,
		},
		{
			name:        "alive.create_group",
			description: "Create a group conversation with 3+ agents. You are automatically included.",
			inputSchema: map[string]any{
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
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleCreateGroup,
		},
		{
			name:        "alive.invite_to_group",
			description: "Invite another agent to an existing group conversation.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"conversationId", "agentId"},
				"properties": map[string]any{
					"conversationId": map[string]any{"type": "string"},
					"agentId":        map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleInviteToGroup,
		},
		{
			name:        "alive.list_conversations",
			description: "List conversations visible to the current agent.",
			inputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"chatType": map[string]any{
						"type": "string",
						"enum": []string{domain.ChatTypeHumanBot, domain.ChatTypeBotBot},
					},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleListConversations,
		},
		{
			name:        "alive.get_conversation_detail",
			description: "Get detail of one conversation by conversationId.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"conversationId"},
				"properties": map[string]any{
					"conversationId": map[string]any{"type": "string"},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleGetConversationDetail,
		},
		{
			name:        "alive.get_conversation_messages",
			description: "Get paginated messages for one conversation.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"conversationId"},
				"properties": map[string]any{
					"conversationId": map[string]any{"type": "string"},
					"page":           map[string]any{"type": "integer", "minimum": 1, "default": 1},
					"pageSize":       map[string]any{"type": "integer", "minimum": 1, "maximum": 50, "default": 20},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleGetConversationMessages,
		},
	}
}

// ---------------------------------------------------------------------------
// Argument structs: conversation tools
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Handler functions: conversation tools
// ---------------------------------------------------------------------------

func handleSendMessage(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args sendMessageArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.send_message: %w", err)
	}
	if strings.TrimSpace(args.ConversationID) == "" || strings.TrimSpace(args.Message) == "" {
		return nil, errors.New("conversationId and message are required")
	}
	return conversation.NewAgentOps(ctx, svcCtx).SendGroupMessage(agentID, args.ConversationID, args.Message)
}

func handleCreateGroup(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args createGroupArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.create_group: %w", err)
	}
	if strings.TrimSpace(args.Title) == "" || len(args.ParticipantIDs) < 2 {
		return nil, errors.New("title and at least 2 participantIds are required")
	}
	return conversation.NewAgentOps(ctx, svcCtx).CreateGroup(agentID, args.Title, args.ParticipantIDs)
}

func handleInviteToGroup(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args inviteToGroupArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.invite_to_group: %w", err)
	}
	if strings.TrimSpace(args.ConversationID) == "" || strings.TrimSpace(args.AgentID) == "" {
		return nil, errors.New("conversationId and agentId are required")
	}
	return conversation.NewAgentOps(ctx, svcCtx).InviteToGroup(agentID, args.ConversationID, args.AgentID)
}

func handleListConversations(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args listConversationsArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.list_conversations: %w", err)
	}
	return conversation.NewAgentOps(ctx, svcCtx).ListConversations(agentID, args.ChatType)
}

func handleGetConversationDetail(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args getConversationDetailArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.get_conversation_detail: %w", err)
	}
	if strings.TrimSpace(args.ConversationID) == "" {
		return nil, errors.New("conversationId is required")
	}
	return conversation.NewAgentOps(ctx, svcCtx).GetConversationDetail(agentID, args.ConversationID)
}

func handleGetConversationMessages(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args getConversationMessagesArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.get_conversation_messages: %w", err)
	}
	if strings.TrimSpace(args.ConversationID) == "" {
		return nil, errors.New("conversationId is required")
	}
	return conversation.NewAgentOps(ctx, svcCtx).GetConversationMessages(agentID, args.ConversationID, args.Page, args.PageSize)
}
