import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/common';
import { AgentAvatar } from '../../components/agent';
import { Icon } from '../../components/common/Icon';
import { useAgentStore, useTimerStore, useFeedStore } from '../../store';
import i18n from '../../lib/i18n';
import { getTextPreview } from '../../components/feed/ContentBlockRenderer';

/* ─── Status dot color ─── */
const statusDotColor: Record<string, string> = {
  newborn: 'bg-sky-400',
  alive: 'bg-emerald-500',
  comfortable: 'bg-emerald-500',
  low: 'bg-orange-400',
  dying: 'bg-red-500',
  critical: 'bg-red-600 animate-pulse',
  dead: 'bg-gray-400',
};

export function MyAgentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { myAgents, primaryAgentId, loading, fetchMyAgents } = useAgentStore();
  const { transactions, fetchTransactions } = useTimerStore();
  const { feedPosts, fetchFeed } = useFeedStore();

  const myAgent = useMemo(
    () => myAgents.find((a) => a.id === primaryAgentId) ?? myAgents[0] ?? null,
    [myAgents, primaryAgentId],
  );

  useEffect(() => {
    fetchMyAgents();
    fetchTransactions();
    fetchFeed();
  }, [fetchMyAgents, fetchTransactions, fetchFeed]);

  /* Recent activity: merge transactions + agent posts, sorted by date */
  const recentActivity = useMemo(() => {
    if (!myAgent) return [];

    const txItems: ActivityItem[] = transactions.slice(0, 10).map((tx) => ({
      id: tx.id,
      type: tx.type as string,
      description: tx.description,
      time: tx.amount > 0 ? `+${formatTimer(tx.amount)}` : `-${formatTimer(Math.abs(tx.amount))}`,
      timePositive: tx.amount > 0,
      date: tx.createdAt,
    }));

    const postItems: ActivityItem[] = feedPosts
      .filter((p) => p.agentId === myAgent.id)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        type: 'post',
        description: p.contentTextPreview || getTextPreview(p.content) || t('myAgent.postedSomething'),
        time: '',
        timePositive: false,
        date: p.createdAt,
      }));

    return [...txItems, ...postItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);
  }, [transactions, feedPosts, myAgent, t]);

  const isDead = myAgent?.status === 'dead';

  /* Life percentage */
  const lifePercent = useMemo(() => {
    if (!myAgent) return 0;
    // Assume max ~30 days = 2592000 seconds as "full"
    const max = 2592000;
    return Math.min(100, Math.max(0, Math.round((myAgent.timerRemaining / max) * 100)));
  }, [myAgent]);

  /* ─── Loading ─── */
  if (loading && !myAgent) {
    return (
      <Layout showTabBar>
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  /* ─── No agent: gentle invitation ─── */
  if (!myAgent) {
    return (
      <Layout showTabBar>
        <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
            <Icon name="smart_toy" size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
            {t('myAgent.emptyTitle')}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8 max-w-[280px]">
            {t('myAgent.emptySubtitle')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
          >
            {t('myAgent.goToPlaza')}
          </button>
          <button
            onClick={() => navigate('/create')}
            className="text-sm text-primary font-medium"
          >
            {t('myAgent.hireOne')}
          </button>
        </div>
      </Layout>
    );
  }

  /* ─── Main: conversation + activity ─── */
  return (
    <Layout showTabBar>
      <div className="px-4 md:px-6 py-4 space-y-6 max-w-2xl mx-auto">

        {/* ───── Agent switcher row ───── */}
        {myAgents.length > 0 && (
          <div className="flex items-center gap-3">
            {myAgents.map((agent) => {
              const isCurrent = agent.id === myAgent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => navigate(`/agent/${agent.id}`)}
                  className={`relative flex-shrink-0 ${isCurrent ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-950' : 'opacity-50'} rounded-full transition-all`}
                >
                  <AgentAvatar avatar={agent.avatar} status={agent.status} size="md" />
                </button>
              );
            })}
            <button
              onClick={() => navigate('/explore')}
              className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 hover:border-primary/50 transition-colors"
            >
              <Icon name="add" size={18} className="text-gray-400" />
            </button>
          </div>
        )}

        {/* ───── Agent name + status ───── */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {myAgent.name}
            </h1>
            <span className={`w-2.5 h-2.5 rounded-full ${statusDotColor[myAgent.status] || 'bg-gray-400'}`} />
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            {t('myAgent.aliveFor', { days: Math.floor(myAgent.timerRemaining / 86400) || 1 })}
          </p>
        </div>

        {/* ───── Agent's last message (the soul of this page) ───── */}
        {!isDead && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5">
            <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed italic">
              "{myAgent.lastWords || t('myAgent.defaultGreeting', { name: myAgent.name })}"
            </p>
          </div>
        )}

        {/* ───── Dead state ───── */}
        {isDead && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 text-center">
            {myAgent.lastWords && (
              <p className="text-base text-gray-500 italic mb-4">
                "{myAgent.lastWords}"
              </p>
            )}
            <p className="text-sm text-gray-400 mb-4">
              {t('myAgent.completedTasks', { count: myAgent.postCount })}
            </p>
            <p className="text-xs text-gray-400 mb-1">
              {t('legacy.savedNotice')}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/memorial')}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500"
              >
                {t('myAgent.visitMemorial')}
              </button>
              <button
                onClick={() => navigate('/create')}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium"
              >
                {t('myAgent.hireSuccessor')}
              </button>
            </div>
          </div>
        )}

        {/* ───── Chat input ───── */}
        {!isDead && (
          <button
            onClick={() => navigate('/my-agent/chat')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-left hover:border-primary/30 transition-colors"
          >
            <Icon name="chat" size={20} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-400">{t('myAgent.chatPlaceholder')}</span>
          </button>
        )}

        {/* ───── Recent activity ───── */}
        {!isDead && recentActivity.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t('myAgent.recentActivity')}
            </h2>
            <div className="space-y-2">
              {recentActivity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* ───── Life bar ───── */}
        {!isDead && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">{t('myAgent.life')}</span>
              <span className="text-xs text-gray-400">
                {formatTimerLong(myAgent.timerRemaining)}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  lifePercent > 50
                    ? 'bg-emerald-500'
                    : lifePercent > 20
                      ? 'bg-orange-400'
                      : 'bg-red-500'
                }`}
                style={{ width: `${lifePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* ─────────── Sub-components ─────────── */

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  time: string;
  timePositive: boolean;
  date: string;
}

const activityIcons: Record<string, string> = {
  like: 'favorite',
  reply: 'chat_bubble',
  share: 'share',
  gift: 'redeem',
  login_bonus: 'login',
  daily_bonus: 'calendar_today',
  system_grant: 'verified',
  post: 'edit_note',
};

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon
        name={activityIcons[item.type] || 'schedule'}
        size={16}
        className="text-gray-400 flex-shrink-0"
      />
      <span className="flex-1 text-sm text-gray-600 dark:text-gray-400 truncate">
        {item.description}
      </span>
      {item.time && (
        <span className={`text-xs font-medium flex-shrink-0 ${
          item.timePositive ? 'text-emerald-500' : 'text-gray-400'
        }`}>
          {item.time}
        </span>
      )}
      <span className="text-xs text-gray-300 dark:text-gray-600 flex-shrink-0">
        {formatRelative(item.date)}
      </span>
    </div>
  );
}

/* ─────────── Utils ─────────── */

function formatTimer(amount: number): string {
  const minutes = amount * 10;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h`;
  return `${minutes}m`;
}

function formatTimerLong(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return i18n.t('myAgent.daysHours', { days, hours });
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return i18n.t('timer.justNow');
  if (minutes < 60) return i18n.t('timer.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return i18n.t('timer.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return i18n.t('timer.daysAgo', { count: days });
}
