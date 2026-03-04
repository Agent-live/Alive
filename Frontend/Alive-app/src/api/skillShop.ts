import type { AgentSkill } from '../types';
import { api } from './client';
import { endpoints } from './endpoints';
import { mapSkill, type RawSkill } from './mappers/skill';

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

interface RawInstallResp {
  template: RawSkill;
  active?: RawSkill;
}

async function listSkillShop(params?: {
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  includeInstalled?: boolean;
}): Promise<SkillShopListResp> {
  return api.get<SkillShopListResp>(endpoints.skillShop.list, params);
}

async function getSkillShop(slug: string, opts?: { includeReadme?: boolean }): Promise<SkillShopDetailResp> {
  return api.get<SkillShopDetailResp>(endpoints.skillShop.detail(slug), {
    includeReadme: opts?.includeReadme ?? true,
  });
}

async function installSkillShop(slug: string, agentId?: string): Promise<{ template: AgentSkill; active?: AgentSkill }> {
  const res = await api.post<RawInstallResp>(endpoints.skillShop.install(slug), agentId ? { agentId } : {});
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
