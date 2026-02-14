import { api } from './client';
import type { ChatHistoryResponse } from '../types';

export const chatApi = {
  getHistory: () => api.get<ChatHistoryResponse>('/chat/history'),
};

