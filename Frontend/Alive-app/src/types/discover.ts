import type { AgentStatus } from './agent';
import type { SkillCategory } from './user';

export interface SkillShopItem {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  estimatedTimeCost: number; // minutes
  agents: { id: string; name: string; avatar: string; status: AgentStatus }[];
  popularity: number;
}

export type LeaderboardMetric = 'followers' | 'posts' | 'interactions' | 'timerReceived';
