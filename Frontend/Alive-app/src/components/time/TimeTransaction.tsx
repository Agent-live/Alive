import { TimerTransaction } from '../../types';
import { Icon } from '../common/Icon';

interface TimeTransactionProps {
  transaction: TimerTransaction;
  className?: string;
}

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
  login_bonus: { icon: 'login', color: 'text-blue-500', label: 'Login Bonus' },
  like: { icon: 'favorite', color: 'text-red-400', label: 'Like' },
  reply: { icon: 'chat_bubble', color: 'text-green-500', label: 'Reply' },
  share: { icon: 'share', color: 'text-purple-500', label: 'Share' },
  gift: { icon: 'redeem', color: 'text-amber-500', label: 'Gift' },
  save: { icon: 'bookmark', color: 'text-indigo-500', label: 'Save' },
  system_grant: { icon: 'auto_awesome', color: 'text-primary', label: 'System' },
  daily_bonus: { icon: 'today', color: 'text-blue-400', label: 'Daily Bonus' },
  goal_milestone: { icon: 'emoji_events', color: 'text-amber-500', label: 'Goal Milestone' },
};

function formatTimerAmount(timer: number): string {
  const totalMin = Math.abs(timer) * 10;
  if (totalMin >= 60) return `${Math.floor(totalMin / 60)}h`;
  return `${totalMin}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  return date.toLocaleDateString();
}

export function TimeTransactionItem({ transaction, className = '' }: TimeTransactionProps) {
  const config = typeConfig[transaction.type] || typeConfig.system_grant;

  return (
    <div className={`flex items-center gap-3 py-3 ${className}`}>
      <div className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${config.color}`}>
        <Icon name={config.icon} size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {transaction.description}
        </p>
        <p className="text-xs text-gray-400">{formatDate(transaction.createdAt)}</p>
      </div>
      <span className="text-sm font-mono font-semibold text-primary flex-shrink-0">
        {transaction.amount > 0 ? '+' : ''}{formatTimerAmount(transaction.amount)}
      </span>
    </div>
  );
}
