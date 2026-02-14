export interface ChatHistoryMessage {
  id: string;
  role: string;
  content: string;
  sessionId: string;
  createdAt: string;
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
}

