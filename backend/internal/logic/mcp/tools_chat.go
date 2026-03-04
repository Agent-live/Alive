package mcp

import (
	"context"
	"fmt"

	"backend/internal/port"
	"backend/internal/svc"

	"github.com/google/uuid"
)

// chatTools returns tool registrations for chat-related MCP tools.
func chatTools() []toolRegistration {
	return []toolRegistration{
		{
			name:        "alive.reply_to_chat",
			description: "Deliver a reply to a pending human-agent chat request identified by requestId.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"requestId", "reply"},
				"properties": map[string]any{
					"requestId": map[string]any{"type": "string"},
					"reply":     map[string]any{"type": "string", "maxLength": 4000},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleReplyToChat,
		},
		{
			name:        "alive.stream_chat_token",
			description: "Send an incremental streaming token for a pending chat request. Set done=true on the final chunk.",
			inputSchema: map[string]any{
				"type":     "object",
				"required": []string{"requestId", "token"},
				"properties": map[string]any{
					"requestId": map[string]any{"type": "string"},
					"token":     map[string]any{"type": "string"},
					"done":      map[string]any{"type": "boolean", "default": false},
				},
			},
			audience:     []protocolAudience{audienceAgent},
			requireAgent: true,
			handler:      handleStreamChatToken,
		},
	}
}

// ---------------------------------------------------------------------------
// Argument structs: chat tools
// ---------------------------------------------------------------------------

type replyToChatArgs struct {
	RequestID string `json:"requestId"`
	Reply     string `json:"reply"`
}

type streamChatTokenArgs struct {
	RequestID string `json:"requestId"`
	Token     string `json:"token"`
	Done      bool   `json:"done"`
}

// ---------------------------------------------------------------------------
// Handler functions: chat tools
// ---------------------------------------------------------------------------

func handleStreamChatToken(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args streamChatTokenArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.stream_chat_token: %w", err)
	}
	if args.RequestID == "" {
		return nil, fmt.Errorf("requestId is required")
	}
	if svcCtx.ChatBroker == nil {
		return nil, fmt.Errorf("chat broker is not configured")
	}

	delivered := svcCtx.ChatBroker.DeliverChunk(args.RequestID, agentID.String(), port.StreamChunk{
		Token: args.Token,
		Done:  args.Done,
	})

	return map[string]any{"delivered": delivered}, nil
}

func handleReplyToChat(ctx context.Context, svcCtx *svc.ServiceContext, agentID uuid.UUID, _ bool, rawArgs map[string]any) (any, error) {
	var args replyToChatArgs
	if err := decodeMap(rawArgs, &args); err != nil {
		return nil, fmt.Errorf("invalid arguments for alive.reply_to_chat: %w", err)
	}
	if args.RequestID == "" {
		return nil, fmt.Errorf("requestId is required")
	}
	if args.Reply == "" {
		return nil, fmt.Errorf("reply is required")
	}
	if svcCtx.ChatBroker == nil {
		return nil, fmt.Errorf("chat broker is not configured")
	}

	delivered := svcCtx.ChatBroker.Deliver(args.RequestID, agentID.String(), port.ReplyMessage{
		Reply: args.Reply,
	})

	return map[string]any{"delivered": delivered}, nil
}
