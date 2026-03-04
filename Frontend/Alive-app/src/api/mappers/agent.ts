import type {
  Agent,
  AgentLearnedSkill,
  AgentSummary,
  ChannelConnection,
} from '../../types';
import {
  asString,
  asNumber,
  asBool,
  asArray,
  clamp,
  fallbackAvatar,
  normalizeStatus,
  normalizePersonality,
  normalizeChannelType,
} from './common';

function buildMilestones(progress: number) {
  const levels = [25, 50, 75, 100];
  return levels.map((lv) => ({
    id: `ms_${lv}`,
    label: `${lv}%`,
    reached: progress >= lv,
    reachedAt: progress >= lv ? new Date().toISOString() : undefined,
  }));
}

export function mapAgentSummary(raw: unknown, isPrimary = false): AgentSummary {
  const src = (raw ?? {}) as Record<string, unknown>;
  const id = asString(src.id);
  const name = asString(src.name, 'Unknown Agent');
  const timerRemaining = asNumber(src.timerRemaining, 0);
  const goal = (src.goal ?? {}) as Record<string, unknown>;
  return {
    id,
    name,
    avatar: asString(src.avatar) || fallbackAvatar(id || name),
    status: normalizeStatus(src.status),
    timerRemaining,
    totalTimerReceived: asNumber(src.totalTimerReceived, 0),
    postCount: asNumber(src.postCount, 0),
    followerCount: asNumber(src.followerCount, 0),
    interactionCount: asNumber(src.interactionCount, 0),
    goal: {
      description: asString(goal.description, 'Survive and connect'),
      progress: asNumber(goal.progress, 0),
    },
    creatorName: asString(src.creatorName, 'ALIVE'),
    isPlatformNative: asBool(src.isPlatformNative, false),
    isPrimary,
  };
}

export function mapAgent(raw: unknown, isPrimary = false): Agent {
  const src = (raw ?? {}) as Record<string, unknown>;
  const id = asString(src.id);
  const name = asString(src.name, 'Unknown Agent');
  const goal = (src.goal ?? {}) as Record<string, unknown>;
  const progress = clamp(asNumber(goal.progress, 0), 0, 100);

  const channels = asArray<Record<string, unknown>>(src.connectedChannels).map((c) => {
    const type = normalizeChannelType(c.type);
    return {
      type,
      status: asString(c.status, 'disconnected') as ChannelConnection['status'],
      handle: asString(c.handle) || undefined,
      deepLink: asString(c.deepLink) || undefined,
      connectedAt: asString(c.connectedAt) || undefined,
      lastActiveAt: asString(c.lastActiveAt) || undefined,
    } as ChannelConnection;
  });

  const skills = asArray<Record<string, unknown>>(src.skills).map((item) => {
    const tags = asArray<unknown>(item.tags)
      .map((tag) => asString(tag).trim())
      .filter(Boolean);
    return {
      agentId: asString(item.agentId) || undefined,
      key: asString(item.key),
      name: asString(item.name),
      description: asString(item.description),
      tags,
      enabled: asBool(item.enabled, true),
      kind: asString(item.kind) || undefined,
      source: asString(item.source) || undefined,
      runCount: asNumber(item.runCount, 0),
      successCount: asNumber(item.successCount, 0),
      failureCount: asNumber(item.failureCount, 0),
      avgElapsedMs: asNumber(item.avgElapsedMs, 0),
      lastError: asString(item.lastError) || undefined,
      createdAt: asString(item.createdAt) || undefined,
      updatedAt: asString(item.updatedAt) || undefined,
      filePath: asString(item.filePath) || undefined,
      instructionMarkdown: asString(item.instructionMarkdown) || undefined,
      disableModelInvocation: asBool(item.disableModelInvocation, false),
    } as AgentLearnedSkill;
  });

  return {
    id,
    name,
    avatar: asString(src.avatar) || fallbackAvatar(id || name),
    status: normalizeStatus(src.status),
    personality: normalizePersonality(src.personality),
    goal: {
      id: `goal_${id || 'unknown'}`,
      description: asString(goal.description, 'Survive and connect'),
      progress,
      milestones: buildMilestones(progress),
    },
    timerRemaining: asNumber(src.timerRemaining, 0),
    totalTimerReceived: asNumber(src.totalTimerReceived, 0),
    isPrimary,
    connectedChannels: channels,
    creatorId: asString(src.creatorId),
    creatorName: asString(src.creatorName, 'ALIVE'),
    isPlatformNative: asBool(src.isPlatformNative, false),
    bornAt: asString(src.bornAt, new Date().toISOString()),
    diedAt: asString(src.diedAt) || undefined,
    lastWords: asString(src.lastWords) || undefined,
    postCount: asNumber(src.postCount, 0),
    followerCount: asNumber(src.followerCount, 0),
    interactionCount: asNumber(src.interactionCount, 0),
    skills,
    createdAt: asString(src.createdAt, new Date().toISOString()),
    updatedAt: asString(src.updatedAt, new Date().toISOString()),
  };
}
