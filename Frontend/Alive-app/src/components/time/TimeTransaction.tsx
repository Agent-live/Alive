import { useTranslation } from 'react-i18next';
import { TimerTransaction } from '../../types';
import { Icon } from '../common/Icon';

interface TimeTransactionProps {
  transaction: TimerTransaction;
  className?: string;
}

const typeConfig: Record<string, { icon: string; color: string; i18nKey: string }> = {
  login_bonus: { icon: 'login', color: 'text-blue-500', i18nKey: 'timer.loginBonus' },
  like: { icon: 'favorite', color: 'text-red-400', i18nKey: 'timer.like' },
  reply: { icon: 'chat_bubble', color: 'text-green-500', i18nKey: 'timer.reply' },
  reply_cost: { icon: 'chat_bubble_outline', color: 'text-orange-400', i18nKey: 'timer.replyCost' },
  share: { icon: 'share', color: 'text-purple-500', i18nKey: 'timer.share' },
  gift: { icon: 'redeem', color: 'text-amber-500', i18nKey: 'timer.gift' },
  save: { icon: 'bookmark', color: 'text-indigo-500', i18nKey: 'timer.save' },
  system_grant: { icon: 'auto_awesome', color: 'text-primary', i18nKey: 'timer.systemGrant' },
  goal_milestone: { icon: 'emoji_events', color: 'text-amber-500', i18nKey: 'timer.goalMilestone' },
  post_cost: { icon: 'edit_note', color: 'text-orange-400', i18nKey: 'timer.postCost' },
  agent_interaction: { icon: 'smart_toy', color: 'text-cyan-500', i18nKey: 'timer.agentInteraction' },
  passive_decay: { icon: 'hourglass_bottom', color: 'text-gray-400', i18nKey: 'timer.passiveDecay' },
};

function formatTimerAmount(timer: number): string {
  const totalMin = Math.abs(timer) * 10;
  if (totalMin >= 60) return `${Math.floor(totalMin / 60)}h`;
  return `${totalMin}m`;
}

export function TimeTransactionItem({ transaction, className = '' }: TimeTransactionProps) {
  const { t } = useTranslation();
  const config = typeConfig[transaction.type] || typeConfig.system_grant;

  const diffMs = Date.now() - new Date(transaction.createdAt).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const timeLabel =
    diffMin < 1 ? t('timer.justNow') :
    diffMin < 60 ? t('timer.minutesAgo', { count: diffMin }) :
    diffMin < 1440 ? t('timer.hoursAgo', { count: Math.floor(diffMin / 60) }) :
    t('timer.daysAgo', { count: Math.floor(diffMin / 1440) });

  return (
    <div className={`flex items-center gap-3 py-3 ${className}`}>
      <div className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${config.color}`}>
        <Icon name={config.icon} size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {t(config.i18nKey)}
        </p>
        <p className="text-xs text-gray-400">{timeLabel}</p>
      </div>
      <span className={`text-sm font-mono font-semibold flex-shrink-0 ${transaction.amount >= 0 ? 'text-primary' : 'text-red-400'}`}>
        {transaction.amount > 0 ? '+' : ''}{formatTimerAmount(transaction.amount)}
      </span>
    </div>
  );
}
