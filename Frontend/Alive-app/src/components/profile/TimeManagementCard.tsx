import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon';
import { DailyBudget } from '../../types';

interface TimeManagementCardProps {
  dailyBudget: DailyBudget | null;
}

export function TimeManagementCard({ dailyBudget }: TimeManagementCardProps) {
  const { t } = useTranslation();

  const remainingTimer = dailyBudget?.remainingTimer ?? 0;
  const usedTimer = dailyBudget?.usedTimer ?? 0;
  const totalTimer = dailyBudget?.dailyTimerBudget ?? 100;
  const progress = totalTimer > 0 ? Math.min((usedTimer / totalTimer) * 100, 100) : 0;

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="schedule" size={18} className="text-primary" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('timer.balance')}</span>
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {remainingTimer} <span className="text-sm font-normal text-gray-400">Timer</span>
        </span>
      </div>

      {/* Daily budget progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span>{t('timer.dailyBudget')}</span>
          <span>{usedTimer}/{totalTimer} Timer</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
