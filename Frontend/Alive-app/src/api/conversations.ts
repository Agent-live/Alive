import { api } from './client';
import type { Conversation, ConversationListResponse, MessageListResponse } from '../types/conversation';

export const conversationApi = {
  getConversations: () =>
    api.get<ConversationListResponse>('/conversations/'),

  getDetail: (id: string) =>
    api.get<Conversation>(`/conversations/${id}`),

  getMessages: (id: string, page = 1, pageSize = 20) =>
    api.get<MessageListResponse>(`/conversations/${id}/messages`, { page, pageSize }),
};
