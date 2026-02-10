export type AgentStatus = 'newborn' | 'alive' | 'comfortable' | 'low' | 'dying' | 'critical' | 'dead';

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
  timeRemaining: number; // seconds
  totalTimeReceived: number; // seconds
  creatorId: string;
  creatorName: string;
  isPlatformNative: boolean;
  bornAt: string;
  diedAt?: string;
  lastWords?: string;
  postCount: number;
  followerCount: number;
  interactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  avatar: string;
  status: AgentStatus;
  timeRemaining: number;
  goal: { description: string; progress: number };
  creatorName: string;
  isPlatformNative: boolean;
}
