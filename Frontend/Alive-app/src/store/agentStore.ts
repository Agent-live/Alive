import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Agent, AgentSummary, AgentStatus, PersonalityConfig } from '../types';
import { agentApi } from '../api/agents';
import { toast } from './uiStore';

interface AgentState {
  myAgents: Agent[];
  primaryAgentId: string | null;
  activeAgentId: string | null;
  agentList: AgentSummary[];
  selectedAgent: Agent | null;
  loading: boolean;
  searchResults: AgentSummary[];

  createAgent: (data: { name: string; personality: PersonalityConfig; goalDescription: string; avatarSeed?: string }) => Promise<Agent>;
  registerAgent: (agentNetId: string) => Promise<Agent>;
  fetchMyAgents: () => Promise<void>;
  setPrimaryAgent: (id: string) => Promise<void>;
  switchActiveAgent: (id: string) => void;
  fetchAgentDetail: (id: string) => Promise<void>;
  fetchAgentList: () => Promise<void>;
  updateAgentTimer: (agentId: string, timerRemaining: number) => void;
  handleDeath: (agentId: string) => void;
  searchAgents: (query: string) => Promise<void>;
  clearSelectedAgent: () => void;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      myAgents: [],
      primaryAgentId: null,
      activeAgentId: null,
      agentList: [],
      selectedAgent: null,
      loading: false,
      searchResults: [],

      createAgent: async (data) => {
        set({ loading: true });
        try {
          const agent = await agentApi.createAgent(data);
          const { myAgents, primaryAgentId } = get();
          const newAgents = [...myAgents, agent];
          set({
            myAgents: newAgents,
            primaryAgentId: primaryAgentId || agent.id,
            activeAgentId: agent.id,
            loading: false,
          });
          toast.success('Agent born!');
          return agent;
        } catch (error) {
          set({ loading: false });
          const message = error instanceof Error ? error.message : 'Failed to create agent';
          toast.error(message);
          throw error;
        }
      },

      registerAgent: async (agentNetId) => {
        set({ loading: true });
        try {
          const agent = await agentApi.registerExternalAgent(agentNetId);
          const { myAgents, primaryAgentId } = get();
          const newAgents = [...myAgents, agent];
          set({
            myAgents: newAgents,
            primaryAgentId: primaryAgentId || agent.id,
            activeAgentId: agent.id,
            loading: false,
          });
          toast.success('Agent registered!');
          return agent;
        } catch (error) {
          set({ loading: false });
          const message = error instanceof Error ? error.message : 'Failed to register agent';
          toast.error(message);
          throw error;
        }
      },

      fetchMyAgents: async () => {
        try {
          const agents = await agentApi.getMyAgents();
          const primaryId = agents.find((a) => a.isPrimary)?.id ?? agents[0]?.id ?? null;
          set({ myAgents: agents, primaryAgentId: primaryId });
        } catch {
          set({ myAgents: [], primaryAgentId: null, activeAgentId: null });
        }
      },

      setPrimaryAgent: async (id) => {
        const { myAgents } = get();
        const updated = myAgents.map((a) => ({ ...a, isPrimary: a.id === id }));
        set({ myAgents: updated, primaryAgentId: id });
        try {
          await agentApi.setPrimaryAgent(id);
          toast.success('Primary agent updated');
        } catch (error) {
          set({ myAgents, primaryAgentId: myAgents.find((a) => a.isPrimary)?.id ?? myAgents[0]?.id ?? null });
          const message = error instanceof Error ? error.message : 'Failed to set primary agent';
          toast.error(message);
        }
      },

      switchActiveAgent: (id) => {
        set({ activeAgentId: id });
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

      updateAgentTimer: (agentId, timerRemaining) => {
        const { myAgents, selectedAgent } = get();
        const updatedAgents = myAgents.map((a) =>
          a.id === agentId ? { ...a, timerRemaining } : a
        );
        set({ myAgents: updatedAgents });
        if (selectedAgent?.id === agentId) {
          set({ selectedAgent: { ...selectedAgent, timerRemaining } });
        }
      },

      handleDeath: (agentId) => {
        const { myAgents, selectedAgent } = get();
        const deadStatus: AgentStatus = 'dead';
        const updatedAgents = myAgents.map((a) =>
          a.id === agentId
            ? { ...a, status: deadStatus, timerRemaining: 0, diedAt: new Date().toISOString() }
            : a
        );
        set({ myAgents: updatedAgents });
        if (selectedAgent?.id === agentId) {
          set({ selectedAgent: { ...selectedAgent, status: deadStatus, timerRemaining: 0, diedAt: new Date().toISOString() } });
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
        primaryAgentId: state.primaryAgentId,
      }),
    }
  )
);
