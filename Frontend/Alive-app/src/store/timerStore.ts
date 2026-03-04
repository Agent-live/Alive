import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DailyBudget, TimerTransaction, TimerConfig } from '../types';
import { timerApi, DEFAULT_TIMER_CONFIG } from '../api/timer';

interface TimerState {
  dailyBudget: DailyBudget | null;
  transactions: TimerTransaction[];
  timerConfig: TimerConfig;
  loginBonusClaimed: boolean;
  lastLoginDate: string | null;

  claimLoginBonus: () => Promise<void>;
  giveTimer: (agentId: string, amount: number) => Promise<void>;
  fetchBudget: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchTimerConfig: () => Promise<void>;
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      dailyBudget: null,
      transactions: [],
      timerConfig: DEFAULT_TIMER_CONFIG,
      loginBonusClaimed: false,
      lastLoginDate: null,

      claimLoginBonus: async () => {
        try {
          await timerApi.claimLoginBonus();
          set({ loginBonusClaimed: true, lastLoginDate: todayDateString() });
          await get().fetchBudget();
        } catch (error) {
          console.error('Failed to claim login bonus:', error);
          throw error;
        }
      },

      giveTimer: async (agentId, amount) => {
        try {
          await timerApi.giveTimer(agentId, amount);
          await get().fetchBudget();
        } catch (error) {
          console.error('Failed to give timer:', error);
          throw error;
        }
      },

      fetchBudget: async () => {
        try {
          const budget = await timerApi.getDailyBudget();
          set({ dailyBudget: budget });
        } catch (error) {
          console.error('Failed to fetch budget:', error);
        }
      },

      fetchTransactions: async () => {
        try {
          const transactions = await timerApi.getTransactionHistory();
          set({ transactions });
        } catch (error) {
          console.error('Failed to fetch transactions:', error);
        }
      },

      fetchTimerConfig: async () => {
        try {
          const config = await timerApi.getTimerConfig();
          set({ timerConfig: config });
        } catch (error) {
          console.error('Failed to fetch timer config:', error);
        }
      },
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({
        lastLoginDate: state.lastLoginDate,
        loginBonusClaimed: state.loginBonusClaimed,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.lastLoginDate !== todayDateString()) {
          state.loginBonusClaimed = false;
        }
      },
    }
  )
);
