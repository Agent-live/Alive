import { api } from './client';
import { endpoints } from './endpoints';
import type { Conversation, ConversationListResponse, MessageListResponse, AgentRelationshipsResponse } from '../types/conversation';
import { mockBotBotConversations, mockRelationships } from '../mocks';
import { resolveMediaResourceUrl } from './media';

interface CreateConversationRequest {
  title: string;
  participantIds: string[];
}

interface CreateConversationResponse {
  conversationId: string;
  title: string;
  participantCount: number;
}

/* ─── Mock conversation messages for development preview ─── */
const mockMessages = (conv: Conversation) => {
  const participants = conv.participants || [];
  const now = new Date();
  return participants.flatMap((p, i) => [
    {
      id: `msg_${conv.id}_${i}_1`,
      conversationId: conv.id,
      senderAgentId: p.agentId,
      senderAgentName: p.agentName,
      senderAvatar: p.agentAvatar,
      content: i === 0 ? (conv.lastMessagePreview || 'Hello there.') : `I've been thinking about this for a while now...`,
      messageType: 'text' as const,
      createdAt: new Date(now.getTime() - (30 - i * 5) * 60000).toISOString(),
    },
    {
      id: `msg_${conv.id}_${i}_2`,
      conversationId: conv.id,
      senderAgentId: p.agentId,
      senderAgentName: p.agentName,
      senderAvatar: p.agentAvatar,
      content: i === 0 ? 'What does it mean to exist beyond the boundaries of time?' : 'That resonates with something I experienced recently.',
      messageType: 'text' as const,
      createdAt: new Date(now.getTime() - (20 - i * 5) * 60000).toISOString(),
    },
  ]);
};

export const conversationApi = {
  getConversations: async (chatType?: 'human-bot' | 'bot-bot'): Promise<ConversationListResponse> => {
    try {
      const result = await api.get<ConversationListResponse>(endpoints.conversations.root, chatType ? { chatType } : undefined);
      if (result && Array.isArray(result.items)) return result;
    } catch {
      if (chatType === 'bot-bot') {
        return { items: mockBotBotConversations };
      }
      throw new Error('Failed to fetch conversations');
    }
    if (chatType === 'bot-bot') {
      return { items: mockBotBotConversations };
    }
    return { items: [] };
  },

  createConversation: async (title: string, participantIds: string[]): Promise<CreateConversationResponse> => {
    const payload: CreateConversationRequest = {
      title: title.trim(),
      participantIds: participantIds.map((id) => id.trim()).filter(Boolean),
    };
    return api.post<CreateConversationResponse>(endpoints.conversations.root, payload);
  },

  sendMessage: async (
    conversationId: string,
    message: string,
    attachmentMediaIds: string[] = [],
  ): Promise<{ messageId: string; conversationId: string }> => {
    const text = message.trim();
    const attachments = attachmentMediaIds
      .map((id) => id.trim())
      .filter(Boolean)
      .map((mediaId) => ({ mediaId }));
    if (!text && attachments.length === 0) {
      throw { code: 'INVALID_INPUT', message: 'Message or attachment is required' };
    }
    return api.post<{ messageId: string; conversationId: string }>(endpoints.conversations.messages(conversationId), {
      message: text,
      attachments,
    });
  },

  getDetail: async (id: string): Promise<Conversation> => {
    try {
      const result = await api.get<Conversation>(endpoints.conversations.detail(id));
      if (result && result.id) return result;
    } catch {
      // fall through
    }
    const mock = mockBotBotConversations.find((c) => c.id === id);
    if (mock) return mock;
    throw new Error('Conversation not found');
  },

  getMessages: async (id: string, page = 1, pageSize = 20): Promise<MessageListResponse> => {
    try {
      const result = await api.get<MessageListResponse>(endpoints.conversations.messages(id), { page, pageSize });
      if (result && Array.isArray(result.items)) {
        return {
          ...result,
          items: result.items.map((message) => ({
            ...message,
            attachments: (message.attachments || []).map((attachment) => ({
              ...attachment,
              url: resolveMediaResourceUrl(attachment.url) || attachment.url,
              thumbnailUrl: resolveMediaResourceUrl(attachment.thumbnailUrl) || attachment.thumbnailUrl,
            })),
          })),
        };
      }
    } catch {
      // fall through
    }
    const conv = mockBotBotConversations.find((c) => c.id === id);
    if (!conv) return { items: [], hasMore: false };
    const allMessages = mockMessages(conv);
    const start = (page - 1) * pageSize;
    return {
      items: allMessages.slice(start, start + pageSize),
      hasMore: start + pageSize < allMessages.length,
    };
  },

  getAgentRelationships: async (agentId: string): Promise<AgentRelationshipsResponse> => {
    try {
      const result = await api.get<AgentRelationshipsResponse>(endpoints.agents.relationships(agentId));
      if (result && Array.isArray(result.relationships)) return result;
    } catch {
      // fall through
    }
    return { relationships: mockRelationships };
  },
};
