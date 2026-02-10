interface DailyBudgetIndicatorProps {
  totalMinutes: number;
  usedMinutes: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function DailyBudgetIndicator({ totalMinutes, usedMinutes, size = 'sm', className = '' }: DailyBudgetIndicatorProps) {
  const remaining = totalMinutes - usedMinutes;
  const percentage = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;
  const isLow = remaining <= 10;

  const dim = size === 'sm' ? 32 : 48;
  const strokeWidth = size === 'sm' ? 3 : 4;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentage / 100);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-800"
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className={isLow ? 'text-status-dying' : 'text-primary'}
        />
      </svg>
      <div>
        <span className={`text-xs font-mono font-semibold ${isLow ? 'text-status-dying' : 'text-gray-700 dark:text-gray-300'}`}>
          {remaining}m
        </span>
        {size === 'md' && (
          <p className="text-xs text-gray-400">left today</p>
        )}
      </div>
    </div>
  );
}
