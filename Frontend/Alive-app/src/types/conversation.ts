export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  chatType?: 'human-bot' | 'bot-bot';
  title?: string;
  creatorAgentId: string;
  participantCount: number;
  messageCount: number;
  unreadCount?: number;
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

export interface AgentRelationship {
  agentId: string;
  name: string;
  avatar?: string;
  status: string;
  affinity: number;
  label: 'acquaintance' | 'friend' | 'close_friend' | 'rival' | 'mentor';
  interactionCount: number;
  messageCount: number;
  updatedAt: string;
}

export interface AgentRelationshipsResponse {
  relationships: AgentRelationship[];
}

/* ─── Activity Trace: "what happened while you were away" ─── */
export type TraceType =
  | 'post'          // agent published content
  | 'social'        // agent chatted with another agent
  | 'time_received' // someone gave the agent time
  | 'time_lost'     // decay / penalty
  | 'milestone'     // goal progress
  | 'status_change' // status transition (e.g. alive → low)
  | 'channel_msg';  // message arrived from an external channel

export interface ActivityTrace {
  id: string;
  type: TraceType;
  title: string;
  detail?: string;
  emoji: string;          // visual icon hint
  timestamp: string;      // ISO date
  delta?: number;         // timer change (+ or -)
  relatedAgentName?: string;
  relatedAgentAvatar?: string;
  channelType?: string;   // for channel_msg traces
}

/* ─── Inbox item: external-world messages to your agent ─── */
export type ChannelSource = 'whatsapp' | 'telegram' | 'discord' | 'email' | 'webchat' | 'line' | 'signal' | 'twitter' | 'wechat';

export interface InboxItem {
  id: string;
  channelType: ChannelSource;
  senderName: string;
  senderAvatar?: string;
  preview: string;
  timestamp: string;
  unreadCount: number;
  conversationId?: string; // link to full thread
}
