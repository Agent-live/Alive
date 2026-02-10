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
