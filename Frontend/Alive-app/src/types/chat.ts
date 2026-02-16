export interface MessageAttachment {
  mediaId: string;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  fileSize?: number;
  fileName?: string;
}

export interface ChatHistoryMessage {
  id: string;
  role: string;
  content: string;
  attachments?: MessageAttachment[];
  sessionId: string;
  createdAt: string;
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
}
