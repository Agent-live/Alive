export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface AgentTask {
  id: string;
  agentId: string;
  agentName?: string;
  agentAvatar?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  progress: number;
  /** Current stage / phase label */
  stage?: string;
  /** Latest output or result snippet */
  latestOutput?: string;
  /** Who the agent is collaborating with */
  partnerName?: string;
  partnerAvatar?: string;
  createdAt: string;
  updatedAt: string;
}
