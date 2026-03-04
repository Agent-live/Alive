import type { Memorial, MemorialStats, Tribute } from '../../types';
import { asString, asNumber, asArray, fallbackAvatar } from './common';

export function mapTribute(raw: unknown): Tribute {
  const src = (raw ?? {}) as Record<string, unknown>;
  const userName = asString(src.userName || src.authorName, 'Unknown');
  return {
    id: asString(src.id),
    memorialId: asString(src.memorialId),
    userId: asString(src.userId || src.authorId || userName),
    userName,
    userAvatar: asString(src.userAvatar || src.authorAvatar) || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(userName)}`,
    message: asString(src.message),
    createdAt: asString(src.createdAt, new Date().toISOString()),
  };
}

export function mapMemorial(raw: unknown): Memorial {
  const src = (raw ?? {}) as Record<string, unknown>;
  const tributes = asArray<unknown>(src.tributes).map(mapTribute);
  const lifespanHours = asNumber(src.lifespanHours, 0);
  const totalLifespan = asNumber(src.totalLifespan, lifespanHours * 3600);
  return {
    id: asString(src.id),
    agentId: asString(src.agentId),
    agentName: asString(src.agentName, 'Unknown Agent'),
    agentAvatar: asString(src.agentAvatar) || fallbackAvatar(asString(src.agentId)),
    personality: asString(src.personality, ''),
    goal: {
      description: asString((src.goal as Record<string, unknown>)?.description, 'Survive and connect'),
      progress: asNumber((src.goal as Record<string, unknown>)?.progress, 0),
    },
    bornAt: asString(src.bornAt, new Date().toISOString()),
    diedAt: asString(src.diedAt, new Date().toISOString()),
    lastWords: asString(src.lastWords, ''),
    finalReviewStory: asString(src.finalReviewStory) || undefined,
    totalLifespan,
    totalTimerReceived: asNumber(src.totalTimerReceived, 0),
    totalInteractions: asNumber(src.totalInteractions, 0),
    tributeCount: asNumber(src.tributeCount, tributes.length),
    tributes,
    creatorName: asString(src.creatorName, 'ALIVE'),
  };
}

export function mapMemorialStats(raw: unknown): MemorialStats {
  const src = (raw ?? {}) as Record<string, unknown>;
  const longest = (src.longestLived ?? {}) as Record<string, unknown>;
  const mourned = (src.mostMourned ?? {}) as Record<string, unknown>;
  const longestValue = asNumber(longest.lifespan, asNumber(longest.value, 0));
  const longestSeconds = longestValue > 0 && longestValue < 100000 ? longestValue * 3600 : longestValue;

  return {
    totalDeaths: asNumber(src.totalDeaths, 0),
    averageLifespan: asNumber(src.averageLifespan, 0) * 3600,
    longestLived: {
      name: asString(longest.agentName || longest.name),
      lifespan: longestSeconds,
    },
    mostMourned: {
      name: asString(mourned.agentName || mourned.name),
      tributeCount: asNumber(mourned.tributeCount, asNumber(mourned.value, 0)),
    },
  };
}
