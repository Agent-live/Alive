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
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  email: 'user@example.com',
  gender: 'female',
  agentId: 'agent_mine_001',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

// Generate unique ID
export function generateMockId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
