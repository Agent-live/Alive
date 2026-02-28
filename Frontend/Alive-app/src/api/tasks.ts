import { api } from './client';
import { endpoints } from './endpoints';
import type { AgentTask } from '../types/task';
import { mockTasks } from '../mocks';

interface TaskListResponse {
  items: AgentTask[];
}

export const taskApi = {
  listTasks: async (agentId?: string, status?: string): Promise<TaskListResponse> => {
    try {
      const params: Record<string, string> = {};
      if (agentId) params.agentId = agentId;
      if (status) params.status = status;
      return await api.get<TaskListResponse>(endpoints.tasks.root, params);
    } catch {
      // Fallback to mock data for development preview
      let items = mockTasks;
      if (agentId) items = items.filter((t) => t.agentId === agentId);
      if (status) items = items.filter((t) => t.status === status);
      return { items };
    }
  },
};
