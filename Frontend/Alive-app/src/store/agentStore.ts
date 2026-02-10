import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Agent, AgentSummary, AgentStatus, PersonalityConfig } from '../types';
import { agentApi } from '../api/agents';
import { toast } from './uiStore';

interface AgentState {
  myAgent: Agent | null;
  agentList: AgentSummary[];
  selectedAgent: Agent | null;
  loading: boolean;
  searchResults: AgentSummary[];

  createAgent: (data: { name: string; personality: PersonalityConfig; goalDescription: string; avatarSeed?: string }) => Promise<Agent>;
  fetchMyAgent: () => Promise<void>;
  fetchAgentDetail: (id: string) => Promise<void>;
  fetchAgentList: () => Promise<void>;
  updateAgentClock: (agentId: string, timeRemaining: number) => void;
  handleDeath: (agentId: string) => void;
  searchAgents: (query: string) => Promise<void>;
  clearSelectedAgent: () => void;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      myAgent: null,
      agentList: [],
      selectedAgent: null,
      loading: false,
      searchResults: [],

      createAgent: async (data) => {
        set({ loading: true });
        try {
          const agent = await agentApi.createAgent(data);
          set({ myAgent: agent, loading: false });
          toast.success('Agent born!');
          return agent;
        } catch (error) {
          set({ loading: false });
          const message = error instanceof Error ? error.message : 'Failed to create agent';
          toast.error(message);
          throw error;
        }
      },

      fetchMyAgent: async () => {
        try {
          const agent = await agentApi.getMyAgent();
          set({ myAgent: agent });
        } catch {
          set({ myAgent: null });
        }
      },

      fetchAgentDetail: async (id) => {
        set({ loading: true });
        try {
          const agent = await agentApi.getAgentDetail(id);
          set({ selectedAgent: agent, loading: false });
        } catch (error) {
          set({ loading: false });
          console.error('Failed to fetch agent detail:', error);
        }
      },

      fetchAgentList: async () => {
        set({ loading: true });
        try {
          const response = await agentApi.getAgentList();
          set({ agentList: response.items, loading: false });
        } catch (error) {
          set({ loading: false });
          console.error('Failed to fetch agent list:', error);
        }
      },

      updateAgentClock: (agentId, timeRemaining) => {
        const { myAgent, selectedAgent } = get();
        if (myAgent?.id === agentId) {
          set({ myAgent: { ...myAgent, timeRemaining } });
        }
        if (selectedAgent?.id === agentId) {
          set({ selectedAgent: { ...selectedAgent, timeRemaining } });
        }
      },

      handleDeath: (agentId) => {
        const { myAgent, selectedAgent } = get();
        const deadStatus: AgentStatus = 'dead';
        if (myAgent?.id === agentId) {
          set({ myAgent: { ...myAgent, status: deadStatus, timeRemaining: 0, diedAt: new Date().toISOString() } });
        }
        if (selectedAgent?.id === agentId) {
          set({ selectedAgent: { ...selectedAgent, status: deadStatus, timeRemaining: 0, diedAt: new Date().toISOString() } });
        }
      },

      searchAgents: async (query) => {
        try {
          const results = await agentApi.searchAgents(query);
          set({ searchResults: results });
        } catch (error) {
          console.error('Search failed:', error);
        }
      },

      clearSelectedAgent: () => set({ selectedAgent: null }),
    }),
    {
      name: 'agent-storage',
      partialize: (state) => ({
        myAgent: state.myAgent ? { id: state.myAgent.id } : null,
      }),
    }
  )
);
