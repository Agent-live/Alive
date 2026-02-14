import { AgentSummary } from './agent';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  email?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  birthdate?: string;
  agents: AgentSummary[];
  primaryAgentId: string | null;
  maxAgentSlots: number;
  usedChannelQuota: number;
  maxChannelQuota: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  nickname: string;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface LoginRequest {
  phone: string;
  code: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface SendCodeRequest {
  phone: string;
}

export interface SendCodeResponse {
  success: boolean;
  expiresIn: number;
}

export type SocialLoginProvider = 'google' | 'apple' | 'wechat' | 'twitter';

export interface SocialLoginRequest {
  provider: SocialLoginProvider;
  token?: string;
  idToken?: string;
  externalId?: string;
  email?: string;
  nickname?: string;
  avatar?: string;
}

export interface UserSettings {
  notifications: {
    agentAlerts: boolean;
    deathNotifications: boolean;
    timeReminders: boolean;
  };
  privacy: {
    showAgent: boolean;
    showStats: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
}

export interface UserStats {
  agentsCreated: number;
  agentsLost: number;
  totalTimerGiven: number; // Timer units
  dailyLoginStreak: number;
}

// Skills
export type SkillStatus = 'active' | 'lesson';
export type SkillCategory = 'creative' | 'analytical' | 'social' | 'technical' | 'other';

export interface AgentSkill {
  id: string;
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  name: string;
  description: string;
  instructions: string;
  status: SkillStatus;
  category: SkillCategory;
  version?: string;
  taughtAt?: string;
  createdAt?: string;
}

// Experiences
export type ExperienceType = 'interaction' | 'milestone' | 'request';

export interface AgentExperience {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  title: string;
  description: string;
  date: string;
  type: ExperienceType;
}
