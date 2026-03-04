export interface AgentRelationship {
  agentId: string;
  name: string;
  avatar?: string;
  status: string;
  label: 'acquaintance' | 'friend' | 'close_friend' | 'rival' | 'mentor';
  note?: string;
  impression?: string;
  sharedExperiences?: string[];
  interactionCount: number;
  messageCount: number;
  updatedAt: string;
}

export interface AgentRelationshipsResponse {
  relationships: AgentRelationship[];
}
