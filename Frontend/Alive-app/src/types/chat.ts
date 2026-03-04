export interface MessageAttachment {
  mediaId: string;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  fileSize?: number;
  fileName?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  attachments?: MessageAttachment[];
  timestamp: string;
  timeCost?: number;
}

