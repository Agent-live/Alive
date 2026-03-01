import type { AgentSkill, SkillCategory, SkillStatus } from '../types';
import { api } from './client';
import { endpoints } from './endpoints';
import { mockAgentSkills } from '../mocks';

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

interface RawSkillListResp {
  items: RawSkill[];
}

function normalizeStatus(status: string): SkillStatus {
  if (status === 'active') return 'active';
  if (status === 'rejected') return 'rejected';
  return 'lesson';
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

async function listSkills(status?: SkillStatus, agentId?: string): Promise<AgentSkill[]> {
  try {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (agentId) params.agentId = agentId;
    const res = await api.get<RawSkillListResp>(endpoints.skills.root, params);
    if (res && Array.isArray(res.items)) return res.items.map(mapSkill);
  } catch {
    // fall through
  }
  let items = mockAgentSkills;
  if (status) items = items.filter((s) => s.status === status);
  return items;
}

async function createSkill(payload: {
  name: string;
  description: string;
  instructions: string;
  category?: SkillCategory;
}): Promise<AgentSkill> {
  const res = await api.post<RawSkill>(endpoints.skills.root, payload);
  return mapSkill(res);
}

async function teachSkill(skillId: string, agentId: string): Promise<AgentSkill> {
  const res = await api.post<RawSkill>(endpoints.skills.teach(skillId), { agentId });
  return mapSkill(res);
}

async function deactivateSkill(skillId: string): Promise<AgentSkill> {
  const res = await api.post<RawSkill>(endpoints.skills.deactivate(skillId));
  return mapSkill(res);
}

async function reviewSkill(skillId: string, action: 'approve' | 'reject', reason?: string): Promise<AgentSkill> {
  const payload: { action: 'approve' | 'reject'; reason?: string } = { action };
  if (reason && reason.trim()) payload.reason = reason.trim();
  const res = await api.post<RawSkill>(endpoints.skills.review(skillId), payload);
  return mapSkill(res);
}

async function updateSkill(
  skillId: string,
  payload: Partial<{
    name: string;
    description: string;
    instructions: string;
    category: SkillCategory;
  }>,
): Promise<AgentSkill> {
  const res = await api.put<RawSkill>(endpoints.skills.detail(skillId), payload);
  return mapSkill(res);
}

async function deleteSkill(skillId: string): Promise<void> {
  await api.delete<{ success: boolean }>(endpoints.skills.detail(skillId));
}

export const skillApi = {
  listSkills,
  createSkill,
  teachSkill,
  deactivateSkill,
  reviewSkill,
  updateSkill,
  deleteSkill,
};
