import { api } from './client';
import type { Conversation, ConversationListResponse, MessageListResponse, AgentRelationshipsResponse } from '../types/conversation';
import { mockBotBotConversations, mockRelationships } from '../mocks';

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
      const result = await api.get<ConversationListResponse>('/conversations/', chatType ? { chatType } : undefined);
      if (result && Array.isArray(result.items) && result.items.length > 0) {
        return result;
      }
    } catch {
      // API failed — fall through to mock
    }
    return { items: mockBotBotConversations };
  },

  getDetail: async (id: string): Promise<Conversation> => {
    try {
      const result = await api.get<Conversation>(`/conversations/${id}`);
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
      const result = await api.get<MessageListResponse>(`/conversations/${id}/messages`, { page, pageSize });
      if (result && Array.isArray(result.items) && result.items.length > 0) {
        return result;
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
      const result = await api.get<AgentRelationshipsResponse>(`/agents/${agentId}/relationships`);
      if (result && Array.isArray(result.relationships) && result.relationships.length > 0) {
        return result;
      }
    } catch {
      // fall through
    }
    return { relationships: mockRelationships };
  },
};
