// 用户基本信息
export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  email?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  birthdate?: string;
  agentId?: string; // The user's ALIVE agent
  createdAt: string;
  updatedAt: string;
}

// 用户简要信息（用于列表展示）
export interface UserSummary {
  id: string;
  nickname: string;
  avatar?: string;
}

// 认证相关
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
}

// 用户设置
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

// 用户统计
export interface UserStats {
  agentsCreated: number;
  agentsLost: number;
  totalTimeGiven: number; // seconds
  dailyLoginStreak: number;
}

// 教育技能（Teach） — 参考 Anthropic Agent Skills 规范
export type SkillStatus = 'active' | 'lesson';
export type SkillCategory = 'creative' | 'analytical' | 'social' | 'technical' | 'other';

export interface AgentSkill {
  id: string;
  // 绑定 agent（active 技能才有，lesson 无绑定）
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  // Skill 核心字段 (对齐 SKILL.md spec)
  name: string;            // 技能名称
  description: string;     // 简短描述：做什么 & 什么时候用
  instructions: string;    // 教育内容 / 详细指令（Markdown body）
  // 状态 & 元信息
  status: SkillStatus;
  category: SkillCategory;
  version?: string;
  taughtAt?: string;       // ISO date — active 技能的生效时间
  createdAt?: string;      // ISO date — lesson 创建时间
}

// 经历记录（Experience） — 每条记录绑定具体 agent
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
