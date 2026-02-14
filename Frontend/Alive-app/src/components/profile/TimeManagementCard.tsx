import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon';
import { AgentNetBalance, DailyBudget } from '../../types';

interface TimeManagementCardProps {
  balance: AgentNetBalance | null;
  dailyBudget: DailyBudget | null;
  onDeposit: (amount: number) => Promise<void>;
  onWithdraw: (amount: number) => Promise<void>;
}

const PRESETS = [
  { label: '10 Timer', value: 10 },
  { label: '50 Timer', value: 50 },
  { label: '100 Timer', value: 100 },
  { label: '200 Timer', value: 200 },
];

export function TimeManagementCard({ balance, dailyBudget, onDeposit, onWithdraw }: TimeManagementCardProps) {
  const { t } = useTranslation();
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [loading, setLoading] = useState(false);

  const availableTimer = balance?.availableTimer ?? 0;
  const usedTimer = dailyBudget?.usedTimer ?? 0;
  const totalTimer = dailyBudget?.dailyTimerBudget ?? 100;
  const progress = totalTimer > 0 ? Math.min((usedTimer / totalTimer) * 100, 100) : 0;

  const handleAction = async (amount: number) => {
    setLoading(true);
    try {
      if (activeAction === 'deposit') {
        await onDeposit(amount);
      } else {
        await onWithdraw(amount);
      }
      setActiveAction(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="schedule" size={18} className="text-primary" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('time.balance')}</span>
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {availableTimer} <span className="text-sm font-normal text-gray-400">Timer</span>
        </span>
      </div>

      {/* Daily budget progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span>{t('time.dailyBudget')}</span>
          <span>{usedTimer}/{totalTimer} Timer</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Action buttons */}
      {activeAction === null ? (
        <div className="flex gap-2">
          <button
            onClick={() => setActiveAction('deposit')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Icon name="add_circle" size={16} />
            {t('time.deposit')}
          </button>
          <button
            onClick={() => setActiveAction('withdraw')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon name="remove_circle" size={16} />
            {t('time.withdraw')}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              {activeAction === 'deposit' ? t('time.depositToAgentNet') : t('time.withdrawFromAgentNet')}
            </span>
            <button
              onClick={() => setActiveAction(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {t('common.cancel')}
            </button>
          </div>
          <div className="flex gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleAction(preset.value)}
                disabled={loading}
                className="flex-1 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary disabled:opacity-50 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
