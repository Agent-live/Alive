import type { AgentSkill, SkillCategory, SkillStatus } from '../../types';

export interface RawSkill {
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

export function normalizeSkillStatus(status: string): SkillStatus {
  if (status === 'active') return 'active';
  if (status === 'rejected') return 'rejected';
  return 'lesson';
}

export function normalizeSkillCategory(category: string): SkillCategory {
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

export function mapSkill(raw: RawSkill): AgentSkill {
  return {
    id: raw.id,
    agentId: raw.agentId || undefined,
    agentName: raw.agentName || undefined,
    agentAvatar: raw.agentAvatar || undefined,
    name: raw.name,
    description: raw.description,
    instructions: raw.instructions,
    status: normalizeSkillStatus(raw.status),
    category: normalizeSkillCategory(raw.category),
    version: raw.version || undefined,
    taughtAt: raw.taughtAt || undefined,
    createdAt: raw.createdAt || undefined,
  };
}
