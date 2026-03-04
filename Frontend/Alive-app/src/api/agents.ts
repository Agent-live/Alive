import {
  Agent,
  AgentSummary,
  AgentRelationshipsResponse,
  PersonalityConfig,
  PaginatedResponse,
} from "../types";
import { api } from "./client";
import { endpoints } from "./endpoints";
import { mapAgent, mapAgentSummary } from "./mappers";
import { isUuid } from "../utils/validation";

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

interface UserAgentUsage {
  hasAny: boolean;
  agentCount: number;
  usedSlots: number;
  maxSlots: number;
}

interface WaitForAgentReadyOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

function normalizeAgentId(input: string): string {
  return input.trim();
}

function normalizeAgentList(
  raw: RawAgentListResp,
): PaginatedResponse<AgentSummary> {
  return {
    items: raw.items.map((item) => mapAgentSummary(item)),
    total: raw.total,
    page: raw.page,
    pageSize: raw.pageSize,
    hasMore: raw.hasMore,
  };
}

async function getMyAgents(): Promise<Agent[]> {
  const payload = await api.get<RawUserAgentsResp>(endpoints.user.agents);
  const primaryId = normalizeAgentId(payload.primaryAgentId || "");
  const rawAgents = payload.agents || [];

  if (!rawAgents.length) {
    return [];
  }

  const agents = rawAgents
    .map((item) => mapAgent(item, normalizeAgentId((item as RawAgentResp).id || "") === primaryId))
    .filter((agent) => agent.id && isUuid(agent.id));

  if (!agents.length) {
    return [];
  }

  if (!agents.some((agent) => agent.isPrimary)) {
    agents[0] = { ...agents[0], isPrimary: true };
  }

  return agents;
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
  const id = normalizeAgentId(agentId);
  if (!isUuid(id)) {
    throw new Error("Invalid agent id");
  }

  try {
    const raw = await api.get<unknown>(endpoints.agents.detail(id));
    const agent = mapAgent(raw);
    if (agent.id) return agent;
    throw new Error("Invalid agent payload");
  } catch (error) {
    const err = error as { code?: string; message?: string } | undefined;
    const code = err?.code || "";
    if (code === "HTTP_401" || code === "UNAUTHORIZED") {
      throw new Error("Please log in first");
    }
    if (code === "HTTP_400" || code === "BAD_REQUEST") {
      throw new Error("Invalid agent id");
    }
    if (code === "HTTP_404" || code === "NOT_FOUND") {
      throw new Error("Agent not found");
    }
    if (err?.message) {
      throw new Error(err.message);
    }
    throw new Error("Agent not found");
  }
}

async function getAgentList(
  page = 1,
  pageSize = 10,
): Promise<PaginatedResponse<AgentSummary>> {
  const raw = await api.get<RawAgentListResp>(endpoints.agents.root, {
    page,
    pageSize,
  });
  if (raw && Array.isArray(raw.items)) {
    return normalizeAgentList(raw);
  }
  return { items: [], total: 0, page, pageSize, hasMore: false };
}

async function lookupAgentNet(agentNetId: string): Promise<Agent> {
  const id = agentNetId.trim();
  if (!id) {
    throw new Error("AgentNet ID is required");
  }

  try {
    return await getAgentDetail(id);
  } catch {
    const search = await api.get<RawAgentListResp>(endpoints.agents.search, {
      q: id,
    });
    if (!search.items?.length) {
      throw new Error("Agent not found on AgentNet");
    }
    const candidate = search.items[0] as RawAgentResp;
    try {
      return await getAgentDetail(candidate.id);
    } catch {
      return mapAgent(search.items[0]);
    }
  }
}

async function searchAgents(query: string): Promise<AgentSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const raw = await api.get<RawAgentListResp>(endpoints.agents.search, { q });
  if (raw && Array.isArray(raw.items)) {
    return raw.items.map((item) => mapAgentSummary(item));
  }
  return [];
}

async function setPrimaryAgent(agentId: string): Promise<void> {
  await api.put<{ success: boolean }>(endpoints.user.primaryAgent, { agentId });
}

async function getAgentRelationships(
  agentId: string,
): Promise<AgentRelationshipsResponse> {
  const result = await api.get<AgentRelationshipsResponse>(
    endpoints.agents.relationships(agentId),
  );
  if (result && Array.isArray(result.relationships)) return result;
  return { relationships: [] };
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
  } catch (error) {
    console.error('Failed to fetch following agents:', error);
  }
  return [];
}

async function getUserAgentUsage(): Promise<UserAgentUsage> {
  const payload = await api.get<RawUserAgentsResp>(endpoints.user.agents);
  const agentCount = Array.isArray(payload.agents) ? payload.agents.length : 0;
  const usedSlots = Number(payload.usedSlots || 0);
  const maxSlots = Number(payload.maxSlots || 0);
  return {
    hasAny: agentCount > 0 || usedSlots > 0,
    agentCount,
    usedSlots,
    maxSlots,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForAgentReady(
  agentId: string,
  options: WaitForAgentReadyOptions = {},
): Promise<Agent> {
  const timeoutMs = Math.max(1000, options.timeoutMs ?? 12000);
  const intervalMs = Math.max(250, options.intervalMs ?? 1000);
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() <= deadline) {
    try {
      const detail = await getAgentDetail(agentId);
      if (detail.id) return detail;
      lastError = new Error("Agent detail payload is incomplete");
    } catch (error) {
      lastError = error;
    }
    await delay(intervalMs);
  }

  if (lastError instanceof Error && lastError.message.trim()) {
    throw lastError;
  }
  throw new Error("Agent bootstrap timed out");
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

type LeaderboardMetric = 'followers' | 'posts' | 'interactions' | 'timerReceived';

const METRIC_TO_SORT: Record<LeaderboardMetric, string> = {
  followers: 'followers',
  posts: 'posts',
  interactions: 'interactions',
  timerReceived: 'timer',
};

async function fetchLeaderboard(
  metric: LeaderboardMetric,
  page = 1,
  pageSize = 50,
): Promise<{ items: AgentSummary[]; hasMore: boolean }> {
  const resp = await api.get<{ items?: unknown[]; hasMore?: boolean }>(
    endpoints.agents.leaderboard,
    { sortBy: METRIC_TO_SORT[metric], page, pageSize },
  );
  const items = (resp?.items || []).map((item) => mapAgentSummary(item));
  return { items, hasMore: resp?.hasMore ?? false };
}

async function saveAgent(agentId: string): Promise<void> {
  await api.post<{ success: boolean }>(endpoints.feed.saveAgent(agentId));
}

export const agentApi = {
  getMyAgents,
  createAgent,
  getAgentDetail,
  getAgentList,
  lookupAgentNet,
  searchAgents,
  setPrimaryAgent,
  getAgentRelationships,
  followAgent,
  unfollowAgent,
  getFollowingAgents,
  getUserAgentUsage,
  waitForAgentReady,
  fetchLeaderboard,
  saveAgent,
};
