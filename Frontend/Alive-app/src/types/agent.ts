export type AgentStatus = 'newborn' | 'alive' | 'comfortable' | 'low' | 'dying' | 'critical' | 'dead' | 'provisioning' | 'provision_failed';

export type SocialPlatform = 'whatsapp' | 'wechat' | 'telegram' | 'twitter' | 'discord' | 'email' | 'line' | 'signal' | 'webchat';

export interface ChannelConnection {
  type: 'whatsapp' | 'telegram' | 'discord' | 'email' | 'webchat' | 'line' | 'signal' | 'wechat' | 'twitter';
  status: 'connected' | 'pending' | 'disconnected';
  handle?: string;
  deepLink?: string;
  connectedAt?: string;
  lastActiveAt?: string;
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

export interface AgentLearnedSkill {
  agentId?: string;
  key: string;
  name: string;
  description: string;
  tags: string[];
  enabled: boolean;
  kind?: string;
  source?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  avgElapsedMs: number;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
  filePath?: string;
  instructionMarkdown?: string;
  disableModelInvocation: boolean;
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
  creatorId: string;
  creatorName: string;
  isPlatformNative: boolean;
  bornAt: string;
  diedAt?: string;
  lastWords?: string;
  postCount: number;
  followerCount: number;
  interactionCount: number;
  isFollowing?: boolean;
  skills?: AgentLearnedSkill[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  avatar: string;
  status: AgentStatus;
  timerRemaining: number; // Timer units
  totalTimerReceived: number; // Timer units
  postCount: number;
  followerCount: number;
  interactionCount: number;
  goal: { description: string; progress: number };
  creatorName: string;
  isPlatformNative: boolean;
  isPrimary: boolean;
  isFollowing?: boolean;
}
