import { api } from './client';
import { endpoints } from './endpoints';
import type { AgentTask } from '../types/task';

interface TaskListResponse {
  items: AgentTask[];
}

export const taskApi = {
  listTasks: async (agentId?: string, status?: string): Promise<TaskListResponse> => {
    const params: Record<string, string> = {};
    if (agentId) params.agentId = agentId;
    if (status) params.status = status;
    return api.get<TaskListResponse>(endpoints.tasks.root, params);
  },
};
