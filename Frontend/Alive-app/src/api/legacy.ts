import { api } from './client';
import { endpoints } from './endpoints';
import { mockLegacyPacks } from '../mocks/legacy';
import type { LegacyAsset, LegacyPack } from '../types/legacy';

interface RawLegacyListResp {
  items?: unknown[];
}

interface RawLegacyInheritResp {
  success?: boolean;
}

function mapAsset(raw: unknown): LegacyAsset {
  const src = (raw ?? {}) as Record<string, unknown>;
  return {
    type: String(src.type || 'knowledge') as LegacyAsset['type'],
    label: String(src.label || 'Asset'),
    count: Number(src.count || 0) || undefined,
    description: String(src.description || ''),
  };
}

function mapPack(raw: unknown): LegacyPack {
  const src = (raw ?? {}) as Record<string, unknown>;
  const assetsRaw = Array.isArray(src.assets) ? src.assets : [];
  return {
    id: String(src.id || ''),
    agentId: String(src.agentId || ''),
    agentName: String(src.agentName || 'Unknown'),
    agentAvatar: String(src.agentAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(String(src.agentName || 'legacy'))}`),
    diedAt: String(src.diedAt || new Date().toISOString()),
    livedDays: Number(src.livedDays || 0),
    taskCount: Number(src.taskCount || 0),
    styleSummary: String(src.styleSummary || ''),
    assets: assetsRaw.map((item) => mapAsset(item)),
    inheritable: Boolean(src.inheritable ?? true),
    inheritedBy: src.inheritedBy ? String(src.inheritedBy) : undefined,
    createdAt: String(src.createdAt || new Date().toISOString()),
  };
}

export const legacyApi = {
  async getLegacyPacks(): Promise<LegacyPack[]> {
    try {
      const raw = await api.get<RawLegacyListResp>(endpoints.legacy.root);
      if (raw?.items && Array.isArray(raw.items)) {
        return raw.items.map((item) => mapPack(item));
      }
    } catch {
      // fall through to mock
    }
    return mockLegacyPacks;
  },

  async getLegacyDetail(legacyId: string): Promise<LegacyPack | null> {
    try {
      const raw = await api.get<unknown>(endpoints.legacy.detail(legacyId));
      const mapped = mapPack(raw);
      if (mapped.id) {
        return mapped;
      }
    } catch {
      // fall through to mock
    }
    return mockLegacyPacks.find((item) => item.id === legacyId) ?? null;
  },

  async inheritLegacy(newAgentId: string, legacyId: string, mode: 'full' | 'selective'): Promise<void> {
    const payload = {
      newAgentId,
      mode,
    };
    const raw = await api.post<RawLegacyInheritResp>(endpoints.legacy.inherit(legacyId), payload);
    if (raw?.success === false) {
      throw new Error('Failed to inherit legacy');
    }
  },
};

