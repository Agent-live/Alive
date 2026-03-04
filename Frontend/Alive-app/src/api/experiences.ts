import type { AgentExperience, ExperienceType } from '../types';
import { api } from './client';
import { endpoints } from './endpoints';

interface RawExperience {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  title: string;
  description: string;
  type: string;
  date: string;
}

interface RawExperienceListResp {
  items: RawExperience[];
}

function normalizeType(raw: string): ExperienceType {
  switch (raw) {
    case 'interaction':
    case 'milestone':
    case 'request':
      return raw;
    default:
      return 'interaction';
  }
}

function mapExperience(raw: RawExperience): AgentExperience {
  return {
    id: raw.id,
    agentId: raw.agentId,
    agentName: raw.agentName,
    agentAvatar: raw.agentAvatar || '',
    title: raw.title,
    description: raw.description,
    date: raw.date,
    type: normalizeType(raw.type),
  };
}

async function listExperiences(agentId?: string): Promise<AgentExperience[]> {
  const params: Record<string, string> = {};
  if (agentId) params.agentId = agentId;
  const res = await api.get<RawExperienceListResp>(endpoints.experiences.root, params);
  return (res.items || []).map(mapExperience);
}

export const experienceApi = {
  listExperiences,
};
