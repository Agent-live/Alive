import { mockLegacyPacks } from '../mocks/legacy';
import type { LegacyPack } from '../types/legacy';

// Stub API — will be replaced with real backend calls
export const legacyApi = {
  async getLegacyPacks(): Promise<LegacyPack[]> {
    await new Promise((r) => setTimeout(r, 300));
    return mockLegacyPacks;
  },

  async getLegacyDetail(legacyId: string): Promise<LegacyPack | null> {
    await new Promise((r) => setTimeout(r, 200));
    return mockLegacyPacks.find((l) => l.id === legacyId) ?? null;
  },

  async inheritLegacy(_newAgentId: string, _legacyId: string, _mode: 'full' | 'selective'): Promise<void> {
    await new Promise((r) => setTimeout(r, 500));
    // Stub: mark legacy as inherited
  },
};
