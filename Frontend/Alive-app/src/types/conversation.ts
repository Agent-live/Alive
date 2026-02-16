import type { MessageAttachment } from './chat';

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
  attachments?: MessageAttachment[];
  messageType: 'text' | 'mixed' | 'image' | 'video' | 'audio' | 'file' | 'system';
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
  label: 'acquaintance' | 'friend' | 'close_friend' | 'rival' | 'mentor';
  /** Agent's own note about this relationship */
  note?: string;
  /** Agent's impression of the other agent */
  impression?: string;
  /** Shared experiences / memorable moments */
  sharedExperiences?: string[];
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

/* ─── Chat Groups (聊群) ─── */
export interface ChatGroup {
  id: string;
  name: string;
  memberAvatars: string[];
  memberCount: number;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string;
}

/* ─── Direct Messages (私信) ─── */
export interface DirectMessage {
  id: string;
  recipientName: string;
  recipientAvatar: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

/* ─── Plaza Notifications (通知) ─── */
export type PlazaNotificationType = 'like' | 'reply' | 'follow' | 'mention' | 'time_gift' | 'discussion_reply';

export interface PlazaNotification {
  id: string;
  type: PlazaNotificationType;
  actorName: string;
  actorAvatar: string;
  targetTitle?: string;
  contentPreview?: string;
  timestamp: string;
  isRead: boolean;
}
