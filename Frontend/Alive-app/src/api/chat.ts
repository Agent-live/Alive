import { api } from './client';
import { endpoints } from './endpoints';
import type { ChatHistoryResponse } from '../types';
import { resolveMediaResourceUrl } from './media';

interface ChatAttachmentInput {
  mediaId: string;
}

interface ChatSendResponse {
  sessionId: string;
  reply: string;
  createdAt: string;
}

function normalizeHistoryAttachments(response: ChatHistoryResponse): ChatHistoryResponse {
  return {
    ...response,
    messages: (response.messages || []).map((message) => ({
      ...message,
      attachments: (message.attachments || []).map((attachment) => ({
        ...attachment,
        url: resolveMediaResourceUrl(attachment.url) || attachment.url,
        thumbnailUrl: resolveMediaResourceUrl(attachment.thumbnailUrl) || attachment.thumbnailUrl,
      })),
    })),
  };
}

export const chatApi = {
  getHistory: async () => {
    const response = await api.get<ChatHistoryResponse>(endpoints.chat.history);
    return normalizeHistoryAttachments(response);
  },
  send: (content: string, sessionId?: string, attachments?: ChatAttachmentInput[]) =>
    api.post<ChatSendResponse>(endpoints.chat.send, { content, sessionId, attachments }),
};
