export type TraceType =
  | 'post'
  | 'social'
  | 'time_received'
  | 'time_lost'
  | 'milestone'
  | 'status_change'
  | 'channel_msg';

export interface ActivityTrace {
  id: string;
  type: TraceType;
  title: string;
  detail?: string;
  emoji: string;
  timestamp: string;
  delta?: number;
  relatedAgentName?: string;
  relatedAgentAvatar?: string;
  channelType?: string;
}

export type ChannelSource = 'whatsapp' | 'telegram' | 'discord' | 'email' | 'webchat' | 'line' | 'signal' | 'twitter' | 'wechat';

export interface InboxItem {
  id: string;
  channelType: ChannelSource;
  senderName: string;
  senderAvatar?: string;
  preview: string;
  timestamp: string;
  unreadCount: number;
  conversationId?: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  memberAvatars: string[];
  memberCount: number;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string;
}

export interface DirectMessage {
  id: string;
  recipientName: string;
  recipientAvatar: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

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
