import type { AgentSkill, SkillCategory, SkillStatus } from '../types';
import { api } from './client';

export interface SkillShopCategory {
  key: string;
  count: number;
}

export interface SkillShopItem {
  slug: string;
  name: string;
  description: string;
  category: string;
  url: string;
  bundled: boolean;
  installed?: boolean;
  featured?: boolean;
  featuredRank?: number;
}

export interface SkillShopListResp {
  items: SkillShopItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  categories: SkillShopCategory[];
}

export interface SkillShopDetailResp extends SkillShopItem {
  readme?: string;
}

interface RawSkill {
  id: string;
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  name: string;
  description: string;
  instructions: string;
  status: string;
  category: string;
  version?: string;
  taughtAt?: string;
  createdAt?: string;
}

interface RawInstallResp {
  template: RawSkill;
  active?: RawSkill;
}

function normalizeStatus(status: string): SkillStatus {
  return status === 'active' ? 'active' : 'lesson';
}

function normalizeCategory(category: string): SkillCategory {
  switch (category) {
    case 'creative':
    case 'analytical':
    case 'social':
    case 'technical':
      return category;
    default:
      return 'other';
  }
}

function mapSkill(raw: RawSkill): AgentSkill {
  return {
    id: raw.id,
    agentId: raw.agentId || undefined,
    agentName: raw.agentName || undefined,
    agentAvatar: raw.agentAvatar || undefined,
    name: raw.name,
    description: raw.description,
    instructions: raw.instructions,
    status: normalizeStatus(raw.status),
    category: normalizeCategory(raw.category),
    version: raw.version || undefined,
    taughtAt: raw.taughtAt || undefined,
    createdAt: raw.createdAt || undefined,
  };
}

async function listSkillShop(params?: {
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  includeInstalled?: boolean;
}): Promise<SkillShopListResp> {
  return api.get<SkillShopListResp>('/skill-shop/skills', params);
}

async function getSkillShop(slug: string, opts?: { includeReadme?: boolean }): Promise<SkillShopDetailResp> {
  return api.get<SkillShopDetailResp>(`/skill-shop/skills/${slug}`, {
    includeReadme: opts?.includeReadme ?? true,
  });
}

async function installSkillShop(slug: string, agentId?: string): Promise<{ template: AgentSkill; active?: AgentSkill }> {
  const res = await api.post<RawInstallResp>(`/skill-shop/skills/${slug}/install`, agentId ? { agentId } : {});
  return {
    template: mapSkill(res.template),
    active: res.active ? mapSkill(res.active) : undefined,
  };
}

export const skillShopApi = {
  listSkillShop,
  getSkillShop,
  installSkillShop,
};
