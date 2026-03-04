import { api } from './client';
import { endpoints } from './endpoints';
import type { Conversation, ConversationListResponse, MessageListResponse } from '../types/conversation';
import { resolveMediaResourceUrl } from './media';

interface CreateConversationRequest {
  title: string;
  participantIds: string[];
  agentId?: string;
}

interface CreateConversationResponse {
  conversationId: string;
  title: string;
  participantCount: number;
}

interface ConversationChatResponse {
  conversationId: string;
  messageId: string;
  reply: string;
  createdAt: string;
}

interface ConversationChatAttachment {
  mediaId: string;
}

export const conversationApi = {
  chat: async (
    content: string,
    attachments?: ConversationChatAttachment[],
    agentId?: string,
  ): Promise<ConversationChatResponse> => {
    return api.post<ConversationChatResponse>(endpoints.conversations.chat, {
      content,
      attachments,
      agentId: agentId?.trim() || undefined,
    });
  },

  getConversations: async (
    chatType?: 'human-bot' | 'bot-bot',
    agentId?: string,
  ): Promise<ConversationListResponse> => {
    const params: Record<string, unknown> = {};
    if (chatType) params.chatType = chatType;
    if (agentId?.trim()) params.agentId = agentId.trim();
    const result = await api.get<ConversationListResponse>(
      endpoints.conversations.root,
      Object.keys(params).length > 0 ? params : undefined,
    );
    if (result && Array.isArray(result.items)) return result;
    return { items: [] };
  },

  createConversation: async (
    title: string,
    participantIds: string[],
    agentId?: string,
  ): Promise<CreateConversationResponse> => {
    const payload: CreateConversationRequest = {
      title: title.trim(),
      participantIds: participantIds.map((id) => id.trim()).filter(Boolean),
      agentId: agentId?.trim() || undefined,
    };
    return api.post<CreateConversationResponse>(endpoints.conversations.root, payload);
  },

  sendMessage: async (
    conversationId: string,
    message: string,
    attachmentMediaIds: string[] = [],
    agentId?: string,
  ): Promise<{ messageId: string; conversationId: string }> => {
    const text = message.trim();
    const attachments = attachmentMediaIds
      .map((id) => id.trim())
      .filter(Boolean)
      .map((mediaId) => ({ mediaId }));
    if (!text && attachments.length === 0) {
      throw new Error('Message or attachment is required');
    }
    return api.post<{ messageId: string; conversationId: string }>(endpoints.conversations.messages(conversationId), {
      agentId: agentId?.trim() || undefined,
      message: text,
      attachments,
    });
  },

  getDetail: async (id: string, agentId?: string): Promise<Conversation> => {
    const result = await api.get<Conversation>(
      endpoints.conversations.detail(id),
      agentId?.trim() ? { agentId: agentId.trim() } : undefined,
    );
    if (result && result.id) return result;
    throw new Error('Conversation not found');
  },

  markRead: async (id: string, agentId?: string): Promise<{ success: boolean }> => {
    return api.put<{ success: boolean }>(endpoints.conversations.markRead(id), {
      agentId: agentId?.trim() || undefined,
    });
  },

  getMessages: async (
    id: string,
    page = 1,
    pageSize = 20,
    agentId?: string,
  ): Promise<MessageListResponse> => {
    const params: Record<string, unknown> = { page, pageSize };
    if (agentId?.trim()) params.agentId = agentId.trim();
    const result = await api.get<MessageListResponse>(endpoints.conversations.messages(id), params);
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
    return { items: [], hasMore: false };
  },

};
