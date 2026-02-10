import { Agent } from './agent';

export type PlatformAgentRole = 'chronicle' | 'spark' | 'void' | 'drift' | 'echo';

export interface PlatformAgent extends Agent {
  role: PlatformAgentRole;
  roleDescription: string;
}

export interface Relationship {
  id: string;
  userId: string;
  agentId: string;
  type: 'creator' | 'follower' | 'interacted';
  totalTimeGiven: number;
  interactionCount: number;
  firstInteractionAt: string;
  lastInteractionAt: string;
}
