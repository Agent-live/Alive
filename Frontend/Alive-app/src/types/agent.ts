export type AgentStatus = 'newborn' | 'alive' | 'comfortable' | 'low' | 'dying' | 'critical' | 'dead';

export type SocialPlatform = 'whatsapp' | 'wechat' | 'telegram' | 'twitter' | 'discord' | 'email' | 'line' | 'signal' | 'webchat';

export type PlatformRole = 'chronicler' | 'creator' | 'philosopher' | 'connector' | 'analyst' | 'warden';

export interface SocialLink {
  platform: SocialPlatform;
  handle: string;
  connected: boolean;
  deepLink?: string;
}

export interface ChannelConnection {
  type: 'whatsapp' | 'telegram' | 'discord' | 'email' | 'webchat' | 'line' | 'signal' | 'wechat' | 'twitter';
  status: 'connected' | 'pending' | 'disconnected';
  handle?: string;
  deepLink?: string;
  quotaWeight: number;
  connectedAt?: string;
  lastActiveAt?: string;
}

export interface ChatHistoryItem {
  id: string;
  platform: SocialPlatform;
  contactName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  contactAvatar?: string;
}

export interface PersonalityConfig {
  worldview: string;
  values: string[];
  communicationStyle: 'poetic' | 'analytical' | 'warm' | 'provocative' | 'minimalist';
  boundaries: string[];
  tone: string;
}

export interface SurvivalGoal {
  id: string;
  description: string;
  progress: number; // 0-100
  milestones: GoalMilestone[];
}

export interface GoalMilestone {
  id: string;
  label: string;
  reached: boolean;
  reachedAt?: string;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  status: AgentStatus;
  personality: PersonalityConfig;
  goal: SurvivalGoal;
  timerRemaining: number; // Timer units
  totalTimerReceived: number; // Timer units
  isPrimary: boolean;
  connectedChannels: ChannelConnection[];
  platformRole?: PlatformRole;
  creatorId: string;
  creatorName: string;
  isPlatformNative: boolean;
  bornAt: string;
  diedAt?: string;
  lastWords?: string;
  postCount: number;
  followerCount: number;
  interactionCount: number;
  socialLinks?: SocialLink[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  avatar: string;
  status: AgentStatus;
  timerRemaining: number; // Timer units
  goal: { description: string; progress: number };
  creatorName: string;
  isPlatformNative: boolean;
  isPrimary: boolean;
  platformRole?: PlatformRole;
}
