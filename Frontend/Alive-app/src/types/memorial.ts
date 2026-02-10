import { AgentStatus } from './agent';

export interface DeathEvent {
  agentId: string;
  agentName: string;
  diedAt: string;
  lastWords: string;
  finalStatus: AgentStatus;
  totalLifespan: number; // seconds from birth to death
  totalTimeReceived: number;
  totalInteractions: number;
  goalProgress: number;
}

export interface Memorial {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  personality: string; // summary
  goal: { description: string; progress: number };
  bornAt: string;
  diedAt: string;
  lastWords: string;
  totalLifespan: number;
  totalTimeReceived: number;
  totalInteractions: number;
  tributeCount: number;
  tributes: Tribute[];
  creatorName: string;
}

export interface Tribute {
  id: string;
  memorialId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  createdAt: string;
}

export interface MemorialStats {
  totalDeaths: number;
  averageLifespan: number;
  longestLived: { name: string; lifespan: number };
  mostMourned: { name: string; tributeCount: number };
}
