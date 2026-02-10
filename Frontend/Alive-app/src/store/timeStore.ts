import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DailyBudget, TimeTransaction, TimeConfig, AgentNetBalance } from '../types';
import { timeApi } from '../api/time';
import { toast } from './uiStore';

interface TimeState {
  dailyBudget: DailyBudget | null;
  transactions: TimeTransaction[];
  timeConfig: TimeConfig;
  loginBonusClaimed: boolean;
  lastLoginDate: string | null;
  agentNetBalance: AgentNetBalance | null;

  claimLoginBonus: () => Promise<void>;
  giveTime: (agentId: string, amount: number) => Promise<void>;
  fetchBudget: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchAgentNetBalance: () => Promise<void>;
  depositTime: (minutes: number) => Promise<void>;
  withdrawTime: (minutes: number) => Promise<void>;
}

const DEFAULT_TIME_CONFIG: TimeConfig = {
  likeCost: 120,
  replyCost: 300,
  shareCost: 600,
  giftCost: 0,
  dailyBudget: 60,
  loginBonus: 300,
};

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      dailyBudget: null,
      transactions: [],
      timeConfig: DEFAULT_TIME_CONFIG,
      loginBonusClaimed: false,
      lastLoginDate: null,
      agentNetBalance: null,

      claimLoginBonus: async () => {
        try {
          await timeApi.claimLoginBonus();
          set({ loginBonusClaimed: true, lastLoginDate: new Date().toISOString().split('T')[0] });
          toast.success('Login bonus claimed! +5 minutes');
          get().fetchBudget();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to claim bonus';
          toast.error(message);
        }
      },

      giveTime: async (agentId, amount) => {
        try {
          await timeApi.giveTime(agentId, amount);
          toast.success(`Gave ${Math.floor(amount / 60)} minutes!`);
          get().fetchBudget();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to give time';
          toast.error(message);
        }
      },

      fetchBudget: async () => {
        try {
          const budget = await timeApi.getDailyBudget();
          set({ dailyBudget: budget });
        } catch (error) {
          console.error('Failed to fetch budget:', error);
        }
      },

      fetchTransactions: async () => {
        try {
          const transactions = await timeApi.getTransactionHistory();
          set({ transactions });
        } catch (error) {
          console.error('Failed to fetch transactions:', error);
        }
      },

      fetchAgentNetBalance: async () => {
        try {
          const balance = await timeApi.getAgentNetBalance();
          set({ agentNetBalance: balance });
        } catch (error) {
          console.error('Failed to fetch AgentNet balance:', error);
        }
      },

      depositTime: async (minutes) => {
        try {
          await timeApi.depositTime(minutes);
          toast.success(`Deposited ${minutes} minutes to AgentNet`);
          get().fetchAgentNetBalance();
          get().fetchBudget();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Deposit failed';
          toast.error(message);
        }
      },

      withdrawTime: async (minutes) => {
        try {
          await timeApi.withdrawTime(minutes);
          toast.success(`Withdrew ${minutes} minutes from AgentNet`);
          get().fetchAgentNetBalance();
          get().fetchBudget();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Withdraw failed';
          toast.error(message);
        }
      },
    }),
    {
      name: 'time-storage',
      partialize: (state) => ({
        lastLoginDate: state.lastLoginDate,
        loginBonusClaimed: state.loginBonusClaimed,
      }),
    }
  )
);
