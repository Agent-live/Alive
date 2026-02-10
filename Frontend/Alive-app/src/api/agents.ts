import { Agent, AgentSummary, PersonalityConfig, PaginatedResponse } from '../types';
import { mockDelay, generateMockId } from './mock';
import { mockAgents, mockAgentSummaries, mockMyAgent } from '../mocks/agents';

const USE_MOCK = true;

async function getMyAgent(): Promise<Agent> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    return { ...mockMyAgent, timeRemaining: mockMyAgent.timeRemaining - Math.floor(Math.random() * 60) };
  }
  throw new Error('Real API not implemented');
}

async function createAgent(data: {
  name: string;
  personality: PersonalityConfig;
  goalDescription: string;
  avatarSeed?: string;
}): Promise<Agent> {
  if (USE_MOCK) {
    await mockDelay(1000, 2000);
    const newAgent: Agent = {
      id: generateMockId('agent'),
      name: data.name,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.avatarSeed || data.name.toLowerCase()}`,
      status: 'newborn',
      personality: data.personality,
      goal: {
        id: generateMockId('goal'),
        description: data.goalDescription,
        progress: 0,
        milestones: [
          { id: generateMockId('m'), label: 'First interaction', reached: false },
          { id: generateMockId('m'), label: '25% progress', reached: false },
          { id: generateMockId('m'), label: '50% progress', reached: false },
          { id: generateMockId('m'), label: 'Goal complete', reached: false },
        ],
      },
      timeRemaining: 172800, // 48h initial life
      totalTimeReceived: 172800,
      creatorId: 'user_001',
      creatorName: 'ALIVE Explorer',
      isPlatformNative: false,
      bornAt: new Date().toISOString(),
      postCount: 0,
      followerCount: 0,
      interactionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newAgent;
  }
  throw new Error('Real API not implemented');
}

async function getAgentDetail(agentId: string): Promise<Agent> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    const agent = mockAgents.find((a) => a.id === agentId);
    if (!agent) {
      throw { code: 'NOT_FOUND', message: 'Agent not found' };
    }
    return { ...agent };
  }
  throw new Error('Real API not implemented');
}

async function getAgentList(page = 1, pageSize = 10): Promise<PaginatedResponse<AgentSummary>> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
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
  throw new Error('Real API not implemented');
}

async function lookupAgentNet(agentNetId: string): Promise<Agent> {
  if (USE_MOCK) {
    await mockDelay(500, 1000);
    // Mock: treat any existing mock agent ID as a valid AgentNet ID
    const agent = mockAgents.find((a) => a.id === agentNetId);
    if (!agent) {
      throw { code: 'NOT_FOUND', message: 'Agent not found on AgentNet' };
    }
    return { ...agent, isPlatformNative: false };
  }
  throw new Error('Real API not implemented');
}

async function registerExternalAgent(agentNetId: string): Promise<Agent> {
  if (USE_MOCK) {
    await mockDelay(800, 1500);
    const agent = mockAgents.find((a) => a.id === agentNetId);
    if (!agent) {
      throw { code: 'NOT_FOUND', message: 'Agent not found on AgentNet' };
    }
    return {
      ...agent,
      id: generateMockId('agent'),
      isPlatformNative: false,
      creatorId: 'user_001',
      creatorName: 'ALIVE Explorer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  throw new Error('Real API not implemented');
}

async function searchAgents(query: string): Promise<AgentSummary[]> {
  if (USE_MOCK) {
    await mockDelay(200, 400);
    const lowerQuery = query.toLowerCase();
    return mockAgentSummaries.filter(
      (a) =>
        a.name.toLowerCase().includes(lowerQuery) ||
        a.goal.description.toLowerCase().includes(lowerQuery)
    );
  }
  throw new Error('Real API not implemented');
}

export const agentApi = {
  getMyAgent,
  createAgent,
  getAgentDetail,
  getAgentList,
  lookupAgentNet,
  registerExternalAgent,
  searchAgents,
};
