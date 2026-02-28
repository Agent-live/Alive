import { Memorial, MemorialStats, Tribute } from '../types';
import { api } from './client';
import { endpoints } from './endpoints';
import { mapMemorial, mapMemorialStats } from './mappers';
import { mockMemorials, mockMemorialStats } from '../mocks';

interface RawMemorialListResp {
  items: unknown[];
}

function mapTribute(raw: unknown): Tribute {
  const src = (raw ?? {}) as Record<string, unknown>;
  const userName = String(src.userName || src.authorName || 'Anonymous');
  return {
    id: String(src.id || ''),
    memorialId: String(src.memorialId || ''),
    userId: String(src.userId || src.authorId || userName),
    userName,
    userAvatar:
      String(src.userAvatar || src.authorAvatar || '') ||
      `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(userName)}`,
    message: String(src.message || ''),
    createdAt: String(src.createdAt || new Date().toISOString()),
  };
}

async function getMemorialWall(): Promise<Memorial[]> {
  try {
    const raw = await api.get<RawMemorialListResp>(endpoints.memorial.root, { page: 1, pageSize: 100 });
    if (raw && Array.isArray(raw.items) && raw.items.length > 0) {
      return raw.items.map((item) => mapMemorial(item));
    }
  } catch {
    // fall through
  }
  return mockMemorials;
}

async function getMemorial(memorialId: string): Promise<Memorial> {
  try {
    const raw = await api.get<unknown>(endpoints.memorial.detail(memorialId));
    const memorial = mapMemorial(raw);
    if (memorial.id) return memorial;
  } catch {
    // fall through
  }
  const mock = mockMemorials.find((m) => m.id === memorialId);
  if (mock) return mock;
  throw new Error('Memorial not found');
}

async function addTribute(memorialId: string, message: string): Promise<Tribute> {
  const raw = await api.post<unknown>(endpoints.memorial.tribute(memorialId), { message });
  return mapTribute(raw);
}

async function getMemorialStats(): Promise<MemorialStats> {
  try {
    const raw = await api.get<unknown>(endpoints.memorial.stats);
    const stats = mapMemorialStats(raw);
    if (stats.totalDeaths > 0) return stats;
  } catch {
    // fall through
  }
  return mockMemorialStats;
}

export const memorialApi = {
  getMemorialWall,
  getMemorial,
  addTribute,
  getMemorialStats,
};
