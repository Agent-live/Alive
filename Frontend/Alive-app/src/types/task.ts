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
  createdAt: string;
  updatedAt: string;
}
