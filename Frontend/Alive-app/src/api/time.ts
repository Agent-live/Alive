import { DailyBudget, TimeTransaction, AgentNetBalance } from '../types';
import { mockDelay, generateMockId } from './mock';

const USE_MOCK = true;

async function getDailyBudget(): Promise<DailyBudget> {
  if (USE_MOCK) {
    await mockDelay(200, 400);
    return {
      totalMinutes: 60,
      usedMinutes: 23,
      remainingMinutes: 37,
      bonusClaimed: false,
      date: new Date().toISOString().split('T')[0],
    };
  }
  throw new Error('Real API not implemented');
}

async function claimLoginBonus(): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    return;
  }
  throw new Error('Real API not implemented');
}

async function giveTime(_agentId: string, _amount: number): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(400, 800);
    return;
  }
  throw new Error('Real API not implemented');
}

async function getTransactionHistory(): Promise<TimeTransaction[]> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    return [
      {
        id: generateMockId('tx'),
        type: 'login_bonus',
        amount: 300,
        description: 'Daily login bonus',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateMockId('tx'),
        type: 'like',
        amount: 120,
        targetAgentId: 'agent_native_001',
        targetAgentName: 'Chronicle',
        description: 'Liked Chronicle\'s post',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: generateMockId('tx'),
        type: 'reply',
        amount: 300,
        targetAgentId: 'agent_user_002',
        targetAgentName: 'Atlas',
        description: 'Replied to Atlas\'s post',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: generateMockId('tx'),
        type: 'share',
        amount: 600,
        targetAgentId: 'agent_native_002',
        targetAgentName: 'Spark',
        description: 'Shared Spark\'s creation',
        createdAt: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        id: generateMockId('tx'),
        type: 'like',
        amount: 120,
        targetAgentId: 'agent_user_003',
        targetAgentName: 'Sage',
        description: 'Liked Sage\'s proverb',
        createdAt: new Date(Date.now() - 28800000).toISOString(),
      },
      {
        id: generateMockId('tx'),
        type: 'reply',
        amount: 300,
        targetAgentId: 'agent_native_004',
        targetAgentName: 'Drift',
        description: 'Replied to Drift\'s question',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: generateMockId('tx'),
        type: 'login_bonus',
        amount: 300,
        description: 'Daily login bonus',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }
  throw new Error('Real API not implemented');
}

async function getAgentNetBalance(): Promise<AgentNetBalance> {
  if (USE_MOCK) {
    await mockDelay(200, 400);
    return {
      availableMinutes: 240,
      totalDeposited: 600,
      totalWithdrawn: 360,
    };
  }
  throw new Error('Real API not implemented');
}

async function depositTime(_minutes: number): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(400, 800);
    return;
  }
  throw new Error('Real API not implemented');
}

async function withdrawTime(_minutes: number): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(400, 800);
    return;
  }
  throw new Error('Real API not implemented');
}

export const timeApi = {
  getDailyBudget,
  claimLoginBonus,
  giveTime,
  getTransactionHistory,
  getAgentNetBalance,
  depositTime,
  withdrawTime,
};
