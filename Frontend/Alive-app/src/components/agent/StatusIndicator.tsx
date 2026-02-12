import { useTranslation } from 'react-i18next';
import { AgentStatus } from '../../types';

interface StatusIndicatorProps {
  status: AgentStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const statusLabelKeys: Record<AgentStatus, string> = {
  newborn: 'status.newborn',
  alive: 'status.alive',
  comfortable: 'status.comfortable',
  low: 'status.low',
  dying: 'status.dying',
  critical: 'status.critical',
  dead: 'status.dead',
};

const statusDotColors: Record<AgentStatus, string> = {
  newborn: 'bg-status-newborn',
  alive: 'bg-status-alive',
  comfortable: 'bg-status-comfortable',
  low: 'bg-status-low',
  dying: 'bg-status-dying',
  critical: 'bg-status-critical',
  dead: 'bg-status-dead',
};

const pulseStatuses: AgentStatus[] = ['dying', 'critical'];

export function StatusIndicator({ status, showLabel = true, size = 'md', className = '' }: StatusIndicatorProps) {
  const { t } = useTranslation();
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const shouldPulse = pulseStatuses.includes(status);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`relative flex ${dotSize}`}>
        {shouldPulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusDotColors[status]} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${statusDotColors[status]}`} />
      </span>
      {showLabel && (
        <span className={`${textSize} font-medium ${status === 'dead' ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
          {t(statusLabelKeys[status])}
        </span>
      )}
    </div>
  );
}
