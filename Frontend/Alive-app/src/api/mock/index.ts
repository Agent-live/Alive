/**
 * Mock API utilities
 */

import { delay } from '../../utils';
import { User } from '../../types';

// Simulate network delay
export const mockDelay = (min = 200, max = 800) =>
  delay(Math.random() * (max - min) + min);

// Simulate API response
export async function mockResponse<T>(data: T, delayMs?: number): Promise<T> {
  await mockDelay(delayMs, delayMs);
  return data;
}

// Simulate error response
export async function mockError(message: string, code = 'MOCK_ERROR'): Promise<never> {
  await mockDelay(100, 300);
  throw { code, message };
}

// Mock user data
export const mockUser: User = {
  id: 'user_001',
  phone: '13800138000',
  nickname: 'ALIVE Explorer',
  avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=alive-explorer',
  email: 'user@example.com',
  gender: 'female',
  agents: [{
    id: 'agent_mine_001',
    name: 'My First Agent',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=agent1',
    status: 'alive' as const,
    timerRemaining: 288,
    goal: { description: 'Write 100 poems', progress: 0.42 },
    creatorName: 'ALIVE Explorer',
    isPlatformNative: false,
    isPrimary: true,
  }],
  primaryAgentId: 'agent_mine_001',
  maxAgentSlots: 2,
  usedChannelQuota: 0,
  maxChannelQuota: 3,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

// Generate unique ID
export function generateMockId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
