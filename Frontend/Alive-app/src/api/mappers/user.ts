import type { User } from '../../types';
import { asString, asNumber, asArray } from './common';
import { mapAgentSummary } from './agent';

export function mapUser(rawUser: unknown, rawAgentsPayload?: unknown): User {
  const user = (rawUser ?? {}) as Record<string, unknown>;
  const agentPayload = (rawAgentsPayload ?? {}) as Record<string, unknown>;

  const rawAgents = asArray<unknown>(agentPayload.agents);
  const primaryFromPayload = asString(agentPayload.primaryAgentId);

  const agents = rawAgents.map((item) => {
    const summary = mapAgentSummary(item, false);
    const isPrimary = primaryFromPayload ? summary.id === primaryFromPayload : false;
    return { ...summary, isPrimary };
  });

  const fallbackPrimary = asString(user.agentId);
  const primaryAgentId = primaryFromPayload || fallbackPrimary || (agents[0]?.id ?? null);
  const normalizedAgents = primaryAgentId
    ? agents.map((a) => ({ ...a, isPrimary: a.id === primaryAgentId }))
    : agents;

  return {
    id: asString(user.id),
    phone: asString(user.phone),
    nickname: asString(user.nickname, 'ALIVE User'),
    avatar: asString(user.avatar) || undefined,
    email: asString(user.email) || undefined,
    bio: asString(user.bio) || undefined,
    gender: (asString(user.gender) as User['gender']) || undefined,
    birthdate: asString(user.birthdate) || undefined,
    agents: normalizedAgents,
    primaryAgentId,
    maxAgentSlots: asNumber(agentPayload.maxSlots, 1),
    usedChannelQuota: asNumber(user.usedChannelQuota, 0),
    maxChannelQuota: asNumber(user.maxChannelQuota, 3),
    createdAt: asString(user.createdAt, new Date().toISOString()),
    updatedAt: asString(user.updatedAt, new Date().toISOString()),
  };
}
