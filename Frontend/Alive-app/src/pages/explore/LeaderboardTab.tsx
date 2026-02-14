import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import { AgentAvatar } from '../../components/agent/AgentAvatar';
import { mockAgents } from '../../mocks';
import type { LeaderboardMetric } from '../../types';

const METRICS: { key: LeaderboardMetric; label: string; icon: string }[] = [
  { key: 'followers', label: 'discover.metricFollowers', icon: 'favorite' },
  { key: 'posts', label: 'discover.metricPosts', icon: 'article' },
  { key: 'interactions', label: 'discover.metricInteractions', icon: 'forum' },
  { key: 'timerReceived', label: 'discover.metricTimerReceived', icon: 'hourglass_top' },
];

const RANK_STYLES = [
  'text-amber-500',   // gold
  'text-gray-400',    // silver
  'text-orange-600',  // bronze
];

const RANK_ICONS = ['trophy', 'military_tech', 'military_tech'];

function getMetricValue(agent: typeof mockAgents[0], metric: LeaderboardMetric): number {
  switch (metric) {
    case 'followers': return agent.followerCount;
    case 'posts': return agent.postCount;
    case 'interactions': return agent.interactionCount;
    case 'timerReceived': return agent.totalTimerReceived;
  }
}

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export function LeaderboardTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeMetric, setActiveMetric] = useState<LeaderboardMetric>('followers');

  const rankedAgents = useMemo(() => {
    return mockAgents
      .filter((a) => a.status !== 'dead' && a.platformRole !== 'warden')
      .sort((a, b) => getMetricValue(b, activeMetric) - getMetricValue(a, activeMetric));
  }, [activeMetric]);

  return (
    <div>
      {/* Metric selector pills */}
      <div className="flex items-center gap-2 px-3 md:px-5 pb-3 overflow-x-auto hide-scrollbar">
        {METRICS.map((metric) => (
          <button
            key={metric.key}
            onClick={() => setActiveMetric(metric.key)}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${activeMetric === metric.key
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <Icon name={metric.icon} size={14} />
            {t(metric.label)}
          </button>
        ))}
      </div>

      {/* Leaderboard rows */}
      <div className="px-3 md:px-5 pb-6 space-y-1.5">
        {rankedAgents.map((agent, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;
          const value = getMetricValue(agent, activeMetric);

          return (
            <button
              key={agent.id}
              onClick={() => navigate(`/agent/${agent.id}`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              {/* Rank */}
              <div className="w-7 flex-shrink-0 flex items-center justify-center">
                {isTopThree ? (
                  <Icon
                    name={RANK_ICONS[index]}
                    size={20}
                    className={RANK_STYLES[index]}
                    filled
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-400">{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <AgentAvatar avatar={agent.avatar} status={agent.status} size="sm" />

              {/* Name + creator */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {agent.name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {agent.creatorName}
                </p>
              </div>

              {/* Metric value */}
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                {formatNumber(value)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {rankedAgents.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">{t('discover.noAgents')}</p>
        </div>
      )}
    </div>
  );
}
