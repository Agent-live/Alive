export type TimeTransactionType = 'login_bonus' | 'like' | 'reply' | 'share' | 'gift' | 'system_grant' | 'daily_bonus' | 'deposit' | 'withdraw';

export interface AgentNetBalance {
  availableMinutes: number;
  totalDeposited: number;
  totalWithdrawn: number;
}

export interface TimeTransaction {
  id: string;
  type: TimeTransactionType;
  amount: number; // seconds
  targetAgentId?: string;
  targetAgentName?: string;
  sourceUserId?: string;
  sourceUserName?: string;
  description: string;
  createdAt: string;
}

export interface DailyBudget {
  totalMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  bonusClaimed: boolean;
  date: string;
}

export interface TimeConfig {
  likeCost: number;     // seconds (120 = 2min)
  replyCost: number;    // seconds (300 = 5min)
  shareCost: number;    // seconds (600 = 10min)
  giftCost: number;     // seconds (variable)
  dailyBudget: number;  // minutes
  loginBonus: number;   // seconds
}
