import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import type { ActivityTrace } from '../../types/conversation';

interface ActivityTimelineProps {
  traces: ActivityTrace[];
}

const typeColor: Record<string, string> = {
  status_change: 'text-orange-500',
  channel_msg: 'text-blue-500',
  post: 'text-purple-500',
  social: 'text-emerald-500',
  time_received: 'text-sky-500',
  time_lost: 'text-red-500',
  milestone: 'text-amber-500',
};

const typeBg: Record<string, string> = {
  status_change: 'bg-orange-500/10',
  channel_msg: 'bg-blue-500/10',
  post: 'bg-purple-500/10',
  social: 'bg-emerald-500/10',
  time_received: 'bg-sky-500/10',
  time_lost: 'bg-red-500/10',
  milestone: 'bg-amber-500/10',
};

function formatTraceTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '<1m';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

/* ─── Desktop: vertical timeline ─── */
export function ActivityTimeline({ traces }: ActivityTimelineProps) {
  const { t } = useTranslation();

  if (traces.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Icon name="history" size={24} className="text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-xs text-gray-400">{t('myAgent.traceSectionEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {traces.map((trace) => (
        <div
          key={trace.id}
          className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
        >
          {/* Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${typeBg[trace.type] || 'bg-gray-100 dark:bg-gray-800'}`}>
            <Icon
              name={trace.emoji}
              size={16}
              className={typeColor[trace.type] || 'text-gray-400'}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
              {t(trace.title)}
            </p>
            {trace.detail && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                {t(trace.detail)}
              </p>
            )}
          </div>

          {/* Time + delta */}
          <div className="flex-shrink-0 text-right">
            <span className="text-[11px] text-gray-400">{formatTraceTime(trace.timestamp)}</span>
            {trace.delta != null && trace.delta !== 0 && (
              <span className={`block text-[10px] font-medium ${trace.delta > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {trace.delta > 0 ? '+' : ''}{trace.delta >= 60 ? `${Math.round(trace.delta / 60)}h` : `${trace.delta}m`}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Mobile: horizontal scroll cards ─── */
export function ActivityTimelineCompact({ traces }: ActivityTimelineProps) {
  const { t } = useTranslation();

  if (traces.length === 0) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      {traces.slice(0, 6).map((trace) => (
        <div
          key={trace.id}
          className="flex-shrink-0 w-[200px] rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${typeBg[trace.type] || 'bg-gray-100'}`}>
              <Icon name={trace.emoji} size={13} className={typeColor[trace.type] || 'text-gray-400'} />
            </div>
            <span className="text-[10px] text-gray-400">{formatTraceTime(trace.timestamp)}</span>
            {trace.delta != null && trace.delta !== 0 && (
              <span className={`text-[10px] font-medium ml-auto ${trace.delta > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {trace.delta > 0 ? '+' : ''}{trace.delta >= 60 ? `${Math.round(trace.delta / 60)}h` : `${trace.delta}m`}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">
            {t(trace.title)}
          </p>
        </div>
      ))}
    </div>
  );
}
