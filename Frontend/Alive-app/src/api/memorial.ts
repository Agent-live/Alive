import { Memorial, MemorialStats, Tribute } from '../types';
import { mockDelay, generateMockId } from './mock';
import { mockMemorials, mockMemorialStats } from '../mocks/memorial';

const USE_MOCK = true;

async function getMemorialWall(): Promise<Memorial[]> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    return [...mockMemorials];
  }
  throw new Error('Real API not implemented');
}

async function getMemorial(memorialId: string): Promise<Memorial> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    const memorial = mockMemorials.find((m) => m.id === memorialId);
    if (!memorial) {
      throw { code: 'NOT_FOUND', message: 'Memorial not found' };
    }
    return { ...memorial };
  }
  throw new Error('Real API not implemented');
}

async function addTribute(memorialId: string, message: string): Promise<Tribute> {
  if (USE_MOCK) {
    await mockDelay(400, 800);
    return {
      id: generateMockId('tribute'),
      memorialId,
      userId: 'user_001',
      userName: 'ALIVE Explorer',
      userAvatar: 'https://i.pravatar.cc/100?img=1',
      message,
      createdAt: new Date().toISOString(),
    };
  }
  throw new Error('Real API not implemented');
}

async function getMemorialStats(): Promise<MemorialStats> {
  if (USE_MOCK) {
    await mockDelay(200, 400);
    return { ...mockMemorialStats };
  }
  throw new Error('Real API not implemented');
}

export const memorialApi = {
  getMemorialWall,
  getMemorial,
  addTribute,
  getMemorialStats,
};
