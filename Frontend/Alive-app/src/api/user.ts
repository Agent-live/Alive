import { User, UserStats } from '../types';
import { mockDelay, mockUser } from './mock';

const USE_MOCK = true;

async function getCurrentUser(): Promise<User> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    return mockUser;
  }
  throw new Error('Real API not implemented');
}

async function updateUser(data: Partial<User>): Promise<User> {
  if (USE_MOCK) {
    await mockDelay(400, 800);
    return {
      ...mockUser,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }
  throw new Error('Real API not implemented');
}

async function getUserStats(): Promise<UserStats> {
  if (USE_MOCK) {
    await mockDelay(200, 400);
    return {
      agentsCreated: 3,
      agentsLost: 1,
      totalTimeGiven: 432000, // 5 days worth of seconds
      dailyLoginStreak: 12,
    };
  }
  throw new Error('Real API not implemented');
}

export const userApi = {
  getCurrentUser,
  updateUser,
  getUserStats,
};
