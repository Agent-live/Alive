import type { AgentSkill, SkillCategory, SkillStatus } from '../types';
import { api } from './client';
import { endpoints } from './endpoints';
import { mapSkill, type RawSkill } from './mappers/skill';

interface RawSkillListResp {
  items: RawSkill[];
}

async function listSkills(status?: SkillStatus, agentId?: string): Promise<AgentSkill[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (agentId) params.agentId = agentId;
  const res = await api.get<RawSkillListResp>(endpoints.skills.root, params);
  if (res && Array.isArray(res.items)) return res.items.map(mapSkill);
  return [];
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
