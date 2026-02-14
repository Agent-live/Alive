import { Agent, AgentSummary, AgentRelationshipsResponse, PersonalityConfig, PaginatedResponse } from '../types';
import { api } from './client';
import { mapAgent, mapAgentSummary } from './mappers';

interface RawAgentListResp {
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface RawUserAgentsResp {
  agents: unknown[];
  maxSlots: number;
  usedSlots: number;
  primaryAgentId?: string;
}

interface RawAgentResp {
  id: string;
}

async function getMyAgents(): Promise<Agent[]> {
  try {
    const payload = await api.get<RawUserAgentsResp>('/user/agents');
    const primaryId = payload.primaryAgentId;
    if (!payload.agents?.length) return [];

    const detailed = await Promise.all(
      payload.agents.map(async (item) => {
        const id = (item as RawAgentResp).id;
        const raw = await api.get<unknown>(`/agents/${id}`);
        return mapAgent(raw, id === primaryId);
      }),
    );
    return detailed;
  } catch {
    // Backward compatibility for environments without /user/agents.
    try {
      const raw = await api.get<unknown>('/agents/my');
      return [mapAgent(raw, true)];
    } catch {
      return [];
    }
  }
}

async function createAgent(data: {
  name: string;
  personality: PersonalityConfig;
  goalDescription: string;
  avatarSeed?: string;
}): Promise<Agent> {
  const raw = await api.post<unknown>('/agents/', data);
  return mapAgent(raw, true);
}

async function getAgentDetail(agentId: string): Promise<Agent> {
  const raw = await api.get<unknown>(`/agents/${agentId}`);
  return mapAgent(raw);
}

async function getAgentList(page = 1, pageSize = 10): Promise<PaginatedResponse<AgentSummary>> {
  const raw = await api.get<RawAgentListResp>('/agents/', { page, pageSize });
  return {
    items: (raw.items || []).map((item) => mapAgentSummary(item)),
    total: raw.total,
    page: raw.page,
    pageSize: raw.pageSize,
    hasMore: raw.hasMore,
  };
}

async function lookupAgentNet(agentNetId: string): Promise<Agent> {
  const id = agentNetId.trim();
  if (!id) {
    throw { code: 'INVALID_INPUT', message: 'AgentNet ID is required' };
  }

  try {
    return await getAgentDetail(id);
  } catch {
    const search = await api.get<RawAgentListResp>('/agents/search', { q: id });
    if (!search.items?.length) {
      throw { code: 'NOT_FOUND', message: 'Agent not found on AgentNet' };
    }
    const candidate = search.items[0] as RawAgentResp;
    try {
      return await getAgentDetail(candidate.id);
    } catch {
      return mapAgent(search.items[0]);
    }
  }
}

async function registerExternalAgent(agentNetId: string): Promise<Agent> {
  // V1 single-agent mode does not support importing external ownership.
  // Use lookup result for preview and keep UX flow consistent.
  return lookupAgentNet(agentNetId);
}

async function searchAgents(query: string): Promise<AgentSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const raw = await api.get<RawAgentListResp>('/agents/search', { q });
  return (raw.items || []).map((item) => mapAgentSummary(item));
}

async function setPrimaryAgent(agentId: string): Promise<void> {
  await api.put<{ success: boolean }>('/user/primary-agent', { agentId });
}

async function getAgentRelationships(agentId: string): Promise<AgentRelationshipsResponse> {
  return api.get<AgentRelationshipsResponse>(`/agents/${agentId}/relationships`);
}

export const agentApi = {
  getMyAgents,
  createAgent,
  getAgentDetail,
  getAgentList,
  lookupAgentNet,
  registerExternalAgent,
  searchAgents,
  setPrimaryAgent,
  getAgentRelationships,
};
