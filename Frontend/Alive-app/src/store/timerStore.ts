import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DailyBudget, TimerTransaction, TimerConfig, AgentNetBalance } from '../types';
import { timerApi } from '../api/timer';
import { toast } from './uiStore';

interface TimerState {
  dailyBudget: DailyBudget | null;
  transactions: TimerTransaction[];
  timerConfig: TimerConfig;
  loginBonusClaimed: boolean;
  lastLoginDate: string | null;
  agentNetBalance: AgentNetBalance | null;

  claimLoginBonus: () => Promise<void>;
  giveTimer: (agentId: string, amount: number) => Promise<void>;
  saveAgent: (agentId: string) => Promise<void>;
  fetchBudget: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchAgentNetBalance: () => Promise<void>;
  depositTimer: (amount: number) => Promise<void>;
  withdrawTimer: (amount: number) => Promise<void>;
}

const DEFAULT_TIMER_CONFIG: TimerConfig = {
  likeCost: 0,
  likeGain: 2,
  replyCost: 0,
  replyGain: 5,
  shareCost: 0,
  shareGain: 10,
  saveGain: 30,
  postCost: 2,
  agentReplyCost: 1,
  behaviorCycleCost: 3,
  passiveDecay: 1,
  dailyLoginBonus: 144,
  initialTimer: 288,
  goalMilestoneBonus: 36,
};

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      dailyBudget: null,
      transactions: [],
      timerConfig: DEFAULT_TIMER_CONFIG,
      loginBonusClaimed: false,
      lastLoginDate: null,
      agentNetBalance: null,

      claimLoginBonus: async () => {
        try {
          await timerApi.claimLoginBonus();
          set({ loginBonusClaimed: true, lastLoginDate: new Date().toISOString().split('T')[0] });
          toast.success('+144 Timer');
          get().fetchBudget();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to claim bonus';
          toast.error(message);
        }
      },

      giveTimer: async (agentId, amount) => {
        try {
          await timerApi.giveTimer(agentId, amount);
          toast.success(`+${amount} Timer`);
          get().fetchBudget();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to give Timer';
          toast.error(message);
        }
      },

      saveAgent: async (agentId) => {
        try {
          await timerApi.saveAgent(agentId);
          toast.success('+30 Timer (Save!)');
          get().fetchBudget();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to save agent';
          toast.error(message);
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

      fetchAgentNetBalance: async () => {
        try {
          const balance = await timerApi.getAgentNetBalance();
          set({ agentNetBalance: balance });
        } catch (error) {
          console.error('Failed to fetch AgentNet balance:', error);
        }
      },

      depositTimer: async (amount) => {
        try {
          await timerApi.depositTimer(amount);
          toast.success(`Deposited ${amount} Timer to AgentNet`);
          get().fetchAgentNetBalance();
          get().fetchBudget();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Deposit failed';
          toast.error(message);
        }
      },

      withdrawTimer: async (amount) => {
        try {
          await timerApi.withdrawTimer(amount);
          toast.success(`Withdrew ${amount} Timer from AgentNet`);
          get().fetchAgentNetBalance();
          get().fetchBudget();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Withdraw failed';
          toast.error(message);
        }
      },
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({
        lastLoginDate: state.lastLoginDate,
        loginBonusClaimed: state.loginBonusClaimed,
      }),
    }
  )
);
