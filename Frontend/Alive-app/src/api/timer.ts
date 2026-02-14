import { DailyBudget, TimerTransaction, AgentNetBalance } from '../types';
import { api } from './client';
import { mapDailyBudget, mapTimerTransaction } from './mappers';

interface RawTxListResp {
  items: unknown[];
}

let virtualBalance: AgentNetBalance = {
  availableTimer: 0,
  totalDeposited: 0,
  totalWithdrawn: 0,
};

async function getDailyBudget(): Promise<DailyBudget> {
  const raw = await api.get<unknown>('/timer/daily-budget');
  return mapDailyBudget(raw);
}

async function claimLoginBonus(): Promise<void> {
  await api.post<{ success: boolean }>('/timer/claim-login-bonus');
}

async function giveTimer(agentId: string, amount: number): Promise<void> {
  await api.post<{ success: boolean }>('/timer/give', { agentId, amount });
}

async function getTransactionHistory(): Promise<TimerTransaction[]> {
  const raw = await api.get<RawTxListResp>('/timer/transactions', { page: 1, pageSize: 100 });
  return (raw.items || []).map((item) => mapTimerTransaction(item));
}

async function getAgentNetBalance(): Promise<AgentNetBalance> {
  const budget = await getDailyBudget();
  return {
    availableTimer: Math.max(0, budget.remainingTimer + virtualBalance.availableTimer),
    totalDeposited: virtualBalance.totalDeposited,
    totalWithdrawn: virtualBalance.totalWithdrawn,
  };
}

async function depositTimer(amount: number): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw { code: 'INVALID_AMOUNT', message: 'Amount must be positive' };
  }
  virtualBalance = {
    ...virtualBalance,
    availableTimer: virtualBalance.availableTimer + amount,
    totalDeposited: virtualBalance.totalDeposited + amount,
  };
}

async function withdrawTimer(amount: number): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw { code: 'INVALID_AMOUNT', message: 'Amount must be positive' };
  }
  if (virtualBalance.availableTimer < amount) {
    throw { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient AgentNet balance' };
  }
  virtualBalance = {
    ...virtualBalance,
    availableTimer: virtualBalance.availableTimer - amount,
    totalWithdrawn: virtualBalance.totalWithdrawn + amount,
  };
}

async function saveAgent(agentId: string): Promise<void> {
  await api.post<{ success: boolean }>(`/feed/agents/${agentId}/save`);
}

export const timerApi = {
  getDailyBudget,
  claimLoginBonus,
  giveTimer,
  saveAgent,
  getTransactionHistory,
  getAgentNetBalance,
  depositTimer,
  withdrawTimer,
};
