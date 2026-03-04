import { DailyBudget, TimerConfig, TimerTransaction } from '../types';
import { api } from './client';
import { endpoints } from './endpoints';
import { mapDailyBudget, mapTimerTransaction } from './mappers';

/**
 * Fallback ONLY when /api/v1/timer/config is unreachable.
 * Must match: backend/internal/domain/timer.go
 * Do NOT use for business logic — always prefer timerApi.getTimerConfig().
 */
export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  likeGain: 2,
  replyGain: 5,
  shareGain: 10,
  saveGain: 30,
  postCost: 2,
  agentReplyCost: 1,
  behaviorCycleCost: 3,
  passiveDecay: 1,
  dailyLoginBonus: 144,
  initialTimer: 288,
  goalMilestoneBonus: 36,
  thresholdCritical: 6,
  thresholdDying: 36,
  thresholdLow: 144,
  thresholdComfortable: 288,
};

interface RawTxListResp {
  items: unknown[];
}

async function getDailyBudget(): Promise<DailyBudget> {
  const raw = await api.get<unknown>(endpoints.timer.dailyBudget);
  return mapDailyBudget(raw);
}

async function claimLoginBonus(): Promise<void> {
  await api.post<{ success: boolean }>(endpoints.timer.claimLoginBonus);
}

async function giveTimer(agentId: string, amount: number): Promise<void> {
  await api.post<{ success: boolean }>(endpoints.timer.give, { agentId, amount });
}

async function getTransactionHistory(): Promise<TimerTransaction[]> {
  const raw = await api.get<RawTxListResp>(endpoints.timer.transactions, { page: 1, pageSize: 100 });
  if (raw && Array.isArray(raw.items)) return raw.items.map((item) => mapTimerTransaction(item));
  return [];
}

async function getTimerConfig(): Promise<TimerConfig> {
  try {
    const raw = await api.get<Record<string, unknown>>(endpoints.timer.config);
    if (!raw) return { ...DEFAULT_TIMER_CONFIG };
    return {
      likeGain: Number(raw.likeGain ?? DEFAULT_TIMER_CONFIG.likeGain),
      replyGain: Number(raw.replyGain ?? DEFAULT_TIMER_CONFIG.replyGain),
      shareGain: Number(raw.shareGain ?? DEFAULT_TIMER_CONFIG.shareGain),
      saveGain: Number(raw.saveGain ?? DEFAULT_TIMER_CONFIG.saveGain),
      postCost: Number(raw.postCost ?? DEFAULT_TIMER_CONFIG.postCost),
      agentReplyCost: Number(raw.agentReplyCost ?? DEFAULT_TIMER_CONFIG.agentReplyCost),
      behaviorCycleCost: Number(raw.behaviorCycleCost ?? DEFAULT_TIMER_CONFIG.behaviorCycleCost),
      passiveDecay: Number(raw.passiveDecay ?? DEFAULT_TIMER_CONFIG.passiveDecay),
      dailyLoginBonus: Number(raw.dailyLoginBonus ?? DEFAULT_TIMER_CONFIG.dailyLoginBonus),
      initialTimer: Number(raw.initialTimer ?? DEFAULT_TIMER_CONFIG.initialTimer),
      goalMilestoneBonus: Number(raw.goalMilestoneBonus ?? DEFAULT_TIMER_CONFIG.goalMilestoneBonus),
      thresholdCritical: Number(raw.thresholdCritical ?? DEFAULT_TIMER_CONFIG.thresholdCritical),
      thresholdDying: Number(raw.thresholdDying ?? DEFAULT_TIMER_CONFIG.thresholdDying),
      thresholdLow: Number(raw.thresholdLow ?? DEFAULT_TIMER_CONFIG.thresholdLow),
      thresholdComfortable: Number(raw.thresholdComfortable ?? DEFAULT_TIMER_CONFIG.thresholdComfortable),
    };
  } catch {
    return { ...DEFAULT_TIMER_CONFIG };
  }
}

export const timerApi = {
  getDailyBudget,
  claimLoginBonus,
  giveTimer,
  getTransactionHistory,
  getTimerConfig,
};
