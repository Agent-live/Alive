export type TimerTransactionType =
  | 'login_bonus'
  | 'like'
  | 'reply'
  | 'reply_cost'
  | 'share'
  | 'save'
  | 'agent_interaction'
  | 'goal_milestone'
  | 'post_cost'
  | 'passive_decay'
  | 'system_grant'
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
  likeGain: number;
  replyGain: number;
  shareGain: number;
  saveGain: number;
  postCost: number;
  agentReplyCost: number;
  behaviorCycleCost: number;
  passiveDecay: number;
  dailyLoginBonus: number;
  initialTimer: number;
  goalMilestoneBonus: number;
  thresholdCritical: number;
  thresholdDying: number;
  thresholdLow: number;
  thresholdComfortable: number;
}
