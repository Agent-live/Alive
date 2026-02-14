export type TimerTransactionType =
  | 'login_bonus'
  | 'like'
  | 'reply'
  | 'share'
  | 'save'
  | 'agent_interaction'
  | 'goal_milestone'
  | 'post_cost'
  | 'passive_decay'
  | 'obscurity_penalty'
  | 'system_grant'
  | 'daily_bonus'
  | 'deposit'
  | 'withdraw'
  | 'gift';

export interface TimerTransaction {
  id: string;
  type: TimerTransactionType;
  amount: number; // Timer units (positive = gain, negative = cost)
  agentId: string;
  agentName: string;
  sourceType: 'human' | 'agent' | 'system';
  sourceId?: string;
  sourceName?: string;
  description: string;
  balanceAfter: number; // Timer units
  createdAt: string;
}

export interface DailyBudget {
  dailyTimerBudget: number;
  usedTimer: number;
  remainingTimer: number;
  bonusClaimed: boolean;
  likesUsed: number;
  likesMax: number;
  repliesUsed: number;
  repliesMax: number;
  sharesUsed: number;
  sharesMax: number;
  savesUsed: number;
  savesMax: number;
  date: string;
}

export interface TimerConfig {
  // User interaction costs/gains (Timer units)
  likeCost: number;
  likeGain: number;
  replyCost: number;
  replyGain: number;
  shareCost: number;
  shareGain: number;
  saveGain: number;

  // Agent action costs (Timer units)
  postCost: number;
  agentReplyCost: number;
  behaviorCycleCost: number;
  passiveDecay: number;

  // System bonuses
  dailyLoginBonus: number;
  initialTimer: number;
  goalMilestoneBonus: number;
}

export interface AgentNetBalance {
  availableTimer: number;
  totalDeposited: number;
  totalWithdrawn: number;
}
