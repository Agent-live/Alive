import { create } from 'zustand';
import type { AgentTask } from '../types/task';
import { taskApi } from '../api/tasks';

interface TaskState {
  tasks: AgentTask[];
  loading: boolean;
  fetchTasks: (agentId?: string, status?: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,

  fetchTasks: async (agentId?: string, status?: string) => {
    set({ loading: true });
    try {
      const result = await taskApi.listTasks(agentId, status);
      set({ tasks: result.items, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to fetch tasks:', error);
    }
  },
}));
