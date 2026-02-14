import { Memorial, MemorialStats, Tribute } from '../types';
import { api } from './client';
import { mapMemorial, mapMemorialStats } from './mappers';

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
  const raw = await api.get<RawMemorialListResp>('/memorial/', { page: 1, pageSize: 100 });
  return (raw.items || []).map((item) => mapMemorial(item));
}

async function getMemorial(memorialId: string): Promise<Memorial> {
  const raw = await api.get<unknown>(`/memorial/${memorialId}`);
  return mapMemorial(raw);
}

async function addTribute(memorialId: string, message: string): Promise<Tribute> {
  const raw = await api.post<unknown>(`/memorial/${memorialId}/tribute`, { message });
  return mapTribute(raw);
}

async function getMemorialStats(): Promise<MemorialStats> {
  const raw = await api.get<unknown>('/memorial/stats');
  return mapMemorialStats(raw);
}

export const memorialApi = {
  getMemorialWall,
  getMemorial,
  addTribute,
  getMemorialStats,
};
