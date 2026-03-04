import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Agent, AgentSummary, AgentStatus, PersonalityConfig } from '../types';
import { agentApi } from '../api/agents';
import { extractErrorMessage } from '../utils/error';

interface AgentState {
  myAgents: Agent[];
  primaryAgentId: string | null;
  activeAgentId: string | null;
  agentList: AgentSummary[];
  selectedAgent: Agent | null;
  selectedAgentError: string | null;
  creating: boolean;
  fetchingDetail: boolean;
  fetchingList: boolean;
  searching: boolean;
  searchResults: AgentSummary[];

  createAgent: (data: { name: string; personality: PersonalityConfig; goalDescription: string; avatarSeed?: string }) => Promise<Agent>;
  lookupAndAddAgent: (agentNetId: string) => Promise<Agent>;
  fetchMyAgents: () => Promise<void>;
  setPrimaryAgent: (id: string) => Promise<void>;
  switchActiveAgent: (id: string) => void;
  fetchAgentDetail: (id: string) => Promise<void>;
  fetchAgentList: () => Promise<void>;
  updateAgentTimer: (agentId: string, timerRemaining: number) => void;
  handleDeath: (agentId: string) => void;
  searchAgents: (query: string) => Promise<void>;
  clearSelectedAgent: () => void;
  followAgent: (id: string) => Promise<void>;
  unfollowAgent: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      myAgents: [],
      primaryAgentId: null,
      activeAgentId: null,
      agentList: [],
      selectedAgent: null,
      selectedAgentError: null,
      creating: false,
      fetchingDetail: false,
      fetchingList: false,
      searching: false,
      searchResults: [],

      createAgent: async (data) => {
        set({ creating: true });
        try {
          const agent = await agentApi.createAgent(data);
          const { myAgents, primaryAgentId } = get();
          const newAgents = [...myAgents, agent];
          set({
            myAgents: newAgents,
            primaryAgentId: primaryAgentId || agent.id,
            activeAgentId: agent.id,
            creating: false,
          });
          return agent;
        } catch (error) {
          set({ creating: false });
          throw error;
        }
      },

      lookupAndAddAgent: async (agentNetId) => {
        set({ creating: true });
        try {
          const agent = await agentApi.lookupAgentNet(agentNetId);
          const { myAgents, primaryAgentId } = get();
          const newAgents = [...myAgents, agent];
          set({
            myAgents: newAgents,
            primaryAgentId: primaryAgentId || agent.id,
            activeAgentId: agent.id,
            creating: false,
          });
          return agent;
        } catch (error) {
          set({ creating: false });
          throw error;
        }
      },

      fetchMyAgents: async () => {
        try {
          const agents = await agentApi.getMyAgents();
          const primaryId = agents.find((a) => a.isPrimary)?.id ?? agents[0]?.id ?? null;
          set({ myAgents: agents, primaryAgentId: primaryId });
        } catch (error) {
          console.error('Failed to fetch my agents:', error);
          set({ myAgents: [], primaryAgentId: null, activeAgentId: null });
        }
      },

      setPrimaryAgent: async (id) => {
        const { myAgents } = get();
        const updated = myAgents.map((a) => ({ ...a, isPrimary: a.id === id }));
        set({ myAgents: updated, primaryAgentId: id });
        try {
          await agentApi.setPrimaryAgent(id);
        } catch (error) {
          set({ myAgents, primaryAgentId: myAgents.find((a) => a.isPrimary)?.id ?? myAgents[0]?.id ?? null });
          throw error;
        }
      },

      switchActiveAgent: (id) => {
        set({ activeAgentId: id });
      },

      fetchAgentDetail: async (id) => {
        set({ fetchingDetail: true, selectedAgentError: null });
        try {
          const agent = await agentApi.getAgentDetail(id);
          set({ selectedAgent: agent, selectedAgentError: null, fetchingDetail: false });
        } catch (error) {
          const message = extractErrorMessage(error, 'Failed to fetch agent detail');
          set({ selectedAgent: null, selectedAgentError: message, fetchingDetail: false });
          console.error('Failed to fetch agent detail:', error);
        }
      },

      fetchAgentList: async () => {
        set({ fetchingList: true });
        try {
          const response = await agentApi.getAgentList();
          set({ agentList: response.items, fetchingList: false });
        } catch (error) {
          set({ fetchingList: false });
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
        set({ searching: true });
        try {
          const results = await agentApi.searchAgents(query);
          set({ searchResults: results, searching: false });
        } catch (error) {
          set({ searching: false });
          console.error('Search failed:', error);
        }
      },

      clearSelectedAgent: () => set({ selectedAgent: null, selectedAgentError: null }),

      followAgent: async (id) => {
        const { selectedAgent } = get();
        // Optimistic update
        if (selectedAgent?.id === id) {
          set({ selectedAgent: { ...selectedAgent, isFollowing: true, followerCount: selectedAgent.followerCount + 1 } });
        }
        try {
          await agentApi.followAgent(id);
        } catch (error) {
          // Rollback on error
          if (selectedAgent?.id === id) {
            set({ selectedAgent: { ...selectedAgent, isFollowing: false, followerCount: selectedAgent.followerCount } });
          }
          throw error;
        }
      },

      unfollowAgent: async (id) => {
        const { selectedAgent } = get();
        // Optimistic update
        if (selectedAgent?.id === id) {
          set({ selectedAgent: { ...selectedAgent, isFollowing: false, followerCount: Math.max(0, selectedAgent.followerCount - 1) } });
        }
        try {
          await agentApi.unfollowAgent(id);
        } catch (error) {
          // Rollback on error
          if (selectedAgent?.id === id) {
            set({ selectedAgent: { ...selectedAgent, isFollowing: true, followerCount: selectedAgent.followerCount } });
          }
          throw error;
        }
      },
    }),
    {
      name: 'agent-storage',
      partialize: (state) => ({
        primaryAgentId: state.primaryAgentId,
      }),
    }
  )
);
