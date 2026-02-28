import { Agent, AgentSummary, AgentRelationshipsResponse, PersonalityConfig, PaginatedResponse } from '../types';
import { api } from './client';
import { endpoints } from './endpoints';
import { mapAgent, mapAgentSummary } from './mappers';
import { mockAgents, mockAgentSummaries, mockRelationships } from '../mocks';

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

interface FollowAgentResp {
  success: boolean;
  following: boolean;
  followerCount: number;
}

interface FollowingListResp {
  items: unknown[];
}

async function getMyAgents(): Promise<Agent[]> {
  const payload = await api.get<RawUserAgentsResp>(endpoints.user.agents);
  const primaryId = payload.primaryAgentId;
  if (!payload.agents?.length) {
    return [];
  }

  const detailed = await Promise.all(
    payload.agents.map(async (item) => {
      const id = (item as RawAgentResp).id;
      const raw = await api.get<unknown>(endpoints.agents.detail(id));
      return mapAgent(raw, id === primaryId);
    }),
  );

  return detailed;
}

async function createAgent(data: {
  name: string;
  personality: PersonalityConfig;
  goalDescription: string;
  avatarSeed?: string;
}): Promise<Agent> {
  const raw = await api.post<unknown>(endpoints.agents.root, data);
  return mapAgent(raw, true);
}

async function getAgentDetail(agentId: string): Promise<Agent> {
  try {
    const raw = await api.get<unknown>(endpoints.agents.detail(agentId));
    const agent = mapAgent(raw);
    if (agent.id) return agent;
  } catch {
    // fall through
  }
  const mock = mockAgents.find((a) => a.id === agentId);
  if (mock) return mock;
  throw new Error('Agent not found');
}

async function getAgentList(page = 1, pageSize = 10): Promise<PaginatedResponse<AgentSummary>> {
  try {
    const raw = await api.get<RawAgentListResp>(endpoints.agents.root, { page, pageSize });
    if (raw && Array.isArray(raw.items)) {
      return {
        items: raw.items.map((item) => mapAgentSummary(item)),
        total: raw.total,
        page: raw.page,
        pageSize: raw.pageSize,
        hasMore: raw.hasMore,
      };
    }
  } catch {
    // fall through
  }
  const start = (page - 1) * pageSize;
  const items = mockAgentSummaries.slice(start, start + pageSize);
  return {
    items,
    total: mockAgentSummaries.length,
    page,
    pageSize,
    hasMore: start + pageSize < mockAgentSummaries.length,
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
    const search = await api.get<RawAgentListResp>(endpoints.agents.search, { q: id });
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
  return lookupAgentNet(agentNetId);
}

async function searchAgents(query: string): Promise<AgentSummary[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const raw = await api.get<RawAgentListResp>(endpoints.agents.search, { q });
    if (raw && Array.isArray(raw.items)) {
      return raw.items.map((item) => mapAgentSummary(item));
    }
  } catch {
    // fall through
  }
  const lower = q.toLowerCase();
  return mockAgentSummaries.filter(
    (a) => a.name.toLowerCase().includes(lower) || a.creatorName.toLowerCase().includes(lower),
  );
}

async function setPrimaryAgent(agentId: string): Promise<void> {
  await api.put<{ success: boolean }>(endpoints.user.primaryAgent, { agentId });
}

async function getAgentRelationships(agentId: string): Promise<AgentRelationshipsResponse> {
  try {
    const result = await api.get<AgentRelationshipsResponse>(endpoints.agents.relationships(agentId));
    if (result && Array.isArray(result.relationships)) return result;
  } catch {
    // fall through
  }
  return { relationships: mockRelationships };
}

async function followAgent(agentId: string): Promise<FollowAgentResp> {
  return api.post<FollowAgentResp>(endpoints.agents.follow(agentId));
}

async function unfollowAgent(agentId: string): Promise<FollowAgentResp> {
  return api.delete<FollowAgentResp>(endpoints.agents.follow(agentId));
}

async function getFollowingAgents(): Promise<AgentSummary[]> {
  try {
    const raw = await api.get<FollowingListResp>(endpoints.agents.following);
    if (raw && Array.isArray(raw.items)) {
      return raw.items.map((item) => mapAgentSummary(item));
    }
  } catch {
    // fall through
  }
  return [];
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
  followAgent,
  unfollowAgent,
  getFollowingAgents,
};
