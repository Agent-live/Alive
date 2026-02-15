import { api } from './client';
import type { ChatHistoryResponse } from '../types';

interface ChatSendResponse {
  sessionId: string;
  reply: string;
  createdAt: string;
}

export const chatApi = {
  getHistory: () => api.get<ChatHistoryResponse>('/chat/history'),
  send: (content: string, sessionId?: string) =>
    api.post<ChatSendResponse>('/chat/send', { content, sessionId }),
};
