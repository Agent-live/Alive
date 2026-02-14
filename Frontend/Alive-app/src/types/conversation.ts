export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  creatorAgentId: string;
  participantCount: number;
  messageCount: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  status: string;
  participants?: ConversationParticipantInfo[];
  createdAt: string;
}

export interface ConversationParticipantInfo {
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  role: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderAgentId: string;
  senderAgentName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'system';
  interactionType?: string;
  createdAt: string;
}

export interface ConversationListResponse {
  items: Conversation[];
}

export interface MessageListResponse {
  items: ConversationMessage[];
  hasMore: boolean;
}
