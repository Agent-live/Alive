import { api } from './client';
import type { Conversation, ConversationListResponse, MessageListResponse, AgentRelationshipsResponse } from '../types/conversation';

export const conversationApi = {
  getConversations: (chatType?: 'human-bot' | 'bot-bot') =>
    api.get<ConversationListResponse>('/conversations/', chatType ? { chatType } : undefined),

  getDetail: (id: string) =>
    api.get<Conversation>(`/conversations/${id}`),

  getMessages: (id: string, page = 1, pageSize = 20) =>
    api.get<MessageListResponse>(`/conversations/${id}/messages`, { page, pageSize }),

  getAgentRelationships: (agentId: string) =>
    api.get<AgentRelationshipsResponse>(`/agents/${agentId}/relationships`),
};
