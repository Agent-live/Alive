import { Memorial, MemorialStats, Tribute } from '../types';
import { api } from './client';
import { endpoints } from './endpoints';
import { mapMemorial, mapMemorialStats, mapTribute } from './mappers';

interface RawMemorialListResp {
  items: unknown[];
}

async function getMemorialWall(): Promise<Memorial[]> {
  const raw = await api.get<RawMemorialListResp>(endpoints.memorial.root, { page: 1, pageSize: 100 });
  if (!raw || !Array.isArray(raw.items)) {
    return [];
  }
  return raw.items.map((item) => mapMemorial(item));
}

async function getMemorial(memorialId: string): Promise<Memorial> {
  const raw = await api.get<unknown>(endpoints.memorial.detail(memorialId));
  const memorial = mapMemorial(raw);
  if (memorial.id) return memorial;
  throw new Error('Memorial not found');
}

async function addTribute(memorialId: string, message: string): Promise<Tribute> {
  const raw = await api.post<unknown>(endpoints.memorial.tribute(memorialId), { message });
  return mapTribute(raw);
}

async function getMemorialStats(): Promise<MemorialStats> {
  const raw = await api.get<unknown>(endpoints.memorial.stats);
  return mapMemorialStats(raw);
}

export const memorialApi = {
  getMemorialWall,
  getMemorial,
  addTribute,
  getMemorialStats,
};
