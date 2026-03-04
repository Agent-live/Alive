import { api } from './client';
import { endpoints } from './endpoints';
import type { LegacyAsset, LegacyPack } from '../types/legacy';
import { asString, asNumber } from '../utils/coerce';

interface RawLegacyListResp {
  items?: unknown[];
}

interface RawLegacyInheritResp {
  success?: boolean;
}

const VALID_ASSET_TYPES: LegacyAsset['type'][] = ['task_records', 'style_template', 'knowledge', 'social_memory', 'skills'];

function mapAsset(raw: unknown): LegacyAsset {
  const src = (raw ?? {}) as Record<string, unknown>;
  const rawType = asString(src.type, 'knowledge');
  const type = (VALID_ASSET_TYPES as string[]).includes(rawType) ? rawType as LegacyAsset['type'] : 'knowledge';
  const count = asNumber(src.count, 0);
  return {
    type,
    label: asString(src.label, 'Asset'),
    count: count > 0 ? count : undefined,
    description: asString(src.description),
  };
}

function mapPack(raw: unknown): LegacyPack {
  const src = (raw ?? {}) as Record<string, unknown>;
  const assetsRaw = Array.isArray(src.assets) ? src.assets : [];
  const agentName = asString(src.agentName, 'Unknown');
  return {
    id: asString(src.id),
    agentId: asString(src.agentId),
    agentName,
    agentAvatar: asString(src.agentAvatar) || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agentName || 'legacy')}`,
    diedAt: asString(src.diedAt, new Date().toISOString()),
    livedDays: asNumber(src.livedDays, 0),
    taskCount: asNumber(src.taskCount, 0),
    styleSummary: asString(src.styleSummary),
    assets: assetsRaw.map((item) => mapAsset(item)),
    inheritable: src.inheritable === false ? false : true,
    inheritedBy: asString(src.inheritedBy) || undefined,
    createdAt: asString(src.createdAt, new Date().toISOString()),
  };
}

export const legacyApi = {
  async getLegacyPacks(): Promise<LegacyPack[]> {
    try {
      const raw = await api.get<RawLegacyListResp>(endpoints.legacy.root);
      if (raw?.items && Array.isArray(raw.items)) {
        return raw.items.map((item) => mapPack(item));
      }
    } catch (error) {
      console.error('Failed to fetch legacy packs:', error);
    }
    return [];
  },

  async getLegacyDetail(legacyId: string): Promise<LegacyPack | null> {
    try {
      const raw = await api.get<unknown>(endpoints.legacy.detail(legacyId));
      const mapped = mapPack(raw);
      if (mapped.id) {
        return mapped;
      }
    } catch (error) {
      console.error('Failed to fetch legacy detail:', error);
    }
    return null;
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

