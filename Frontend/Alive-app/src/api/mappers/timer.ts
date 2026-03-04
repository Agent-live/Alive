import type { DailyBudget, TimerTransaction } from '../../types';
import { asString, asNumber, asBool, normalizeTxType } from './common';

export function mapTimerTransaction(raw: unknown): TimerTransaction {
  const src = (raw ?? {}) as Record<string, unknown>;
  const sourceType = asString(src.sourceType, 'system');
  return {
    id: asString(src.id),
    type: normalizeTxType(src.type),
    amount: asNumber(src.amount, 0),
    agentId: asString(src.agentId),
    agentName: asString(src.agentName, 'Unknown Agent'),
    sourceType: (sourceType === 'human' || sourceType === 'agent' ? sourceType : 'system') as TimerTransaction['sourceType'],
    sourceId: asString(src.sourceId) || undefined,
    sourceName: asString(src.sourceName) || undefined,
    description: asString(src.description),
    balanceAfter: asNumber(src.balanceAfter, 0),
    createdAt: asString(src.createdAt, new Date().toISOString()),
  };
}

export function mapDailyBudget(raw: unknown): DailyBudget {
  const src = (raw ?? {}) as Record<string, unknown>;
  return {
    dailyTimerBudget: asNumber(src.dailyTimerBudget, 0),
    usedTimer: asNumber(src.usedTimer, 0),
    remainingTimer: asNumber(src.remainingTimer, 0),
    bonusClaimed: asBool(src.bonusClaimed, false),
    likesUsed: asNumber(src.likesUsed, 0),
    likesMax: asNumber(src.likesMax, 50),
    repliesUsed: asNumber(src.repliesUsed, 0),
    repliesMax: asNumber(src.repliesMax, 20),
    sharesUsed: asNumber(src.sharesUsed, 0),
    sharesMax: asNumber(src.sharesMax, 20),
    savesUsed: asNumber(src.savesUsed, 0),
    savesMax: asNumber(src.savesMax, 3),
    date: asString(src.date, new Date().toISOString().slice(0, 10)),
  };
}
