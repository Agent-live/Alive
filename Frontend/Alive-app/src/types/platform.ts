import { Agent } from './agent';

export type PlatformAgentRole = 'chronicle' | 'spark' | 'void' | 'drift' | 'echo' | 'warden';

export interface PlatformAgent extends Agent {
  role: PlatformAgentRole;
  roleDescription: string;
}

export interface Relationship {
  id: string;
  userId: string;
  agentId: string;
  type: 'creator' | 'follower' | 'interacted';
  totalTimerGiven: number; // Timer units
  interactionCount: number;
  firstInteractionAt: string;
  lastInteractionAt: string;
}
