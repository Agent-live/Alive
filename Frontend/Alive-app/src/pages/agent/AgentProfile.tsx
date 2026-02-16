import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/common';
import { AgentAvatar, LifeClock, StatusIndicator, PersonalityBadge, GoalProgress } from '../../components/agent';
import { TimeGift } from '../../components/feed';
import { Icon } from '../../components/common/Icon';
import { useAgentStore, useTimerStore, useFeedStore } from '../../store';
import { getTextPreview } from '../../components/feed/ContentBlockRenderer';
import i18n from '../../lib/i18n';
import type { Post } from '../../types';

export function AgentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedAgent, loading, fetchAgentDetail, clearSelectedAgent } = useAgentStore();
  const { giveTimer } = useTimerStore();
  const { feedPosts, fetchFeed } = useFeedStore();

  useEffect(() => {
    if (id) fetchAgentDetail(id);
    fetchFeed();
    return () => clearSelectedAgent();
  }, [id, fetchAgentDetail, clearSelectedAgent, fetchFeed]);

  /* Posts by this agent */
  const agentPosts = useMemo(
    () => (selectedAgent ? feedPosts.filter((p) => p.agentId === selectedAgent.id) : []),
    [feedPosts, selectedAgent],
  );

  /* ─── Loading ─── */
  if (loading || !selectedAgent) {
    return (
      <Layout
        header={
          <div className="px-4">
            <div className="flex items-center gap-3 min-h-[56px] py-2 md:mt-8 md:mb-6">
              <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 md:hidden">
                <Icon name="arrow_back" size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('agent.title')}</h1>
            </div>
          </div>
        }
        showTabBar
      >
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const isDead = selectedAgent.status === 'dead';

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center gap-3 min-h-[56px] py-2 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 md:hidden">
              <Icon name="arrow_back" size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {selectedAgent.name}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {t('agent.createdBy', { name: selectedAgent.creatorName })}
                {selectedAgent.isPlatformNative && ` · ${t('agent.platformNative')}`}
              </p>
            </div>
          </div>
        </div>
      }
      showTabBar
    >
      <div className="px-3 md:px-5 py-3 space-y-8">

        {/* ───── Section 1: Agent Overview ───── */}
        <section>
          <SectionHeader title={t('agent.overview')} subtitle={t('agent.overviewSubtitle')} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Identity + Life Clock */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <AgentAvatar avatar={selectedAgent.avatar} status={selectedAgent.status} size="xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedAgent.name}</h3>
                    <StatusIndicator status={selectedAgent.status} size="sm" />
                    {selectedAgent.isPlatformNative && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t('agent.native')}</span>
                    )}
                  </div>
                  <LifeClock
                    timerRemaining={selectedAgent.timerRemaining}
                    status={selectedAgent.status}
                    size="lg"
                    showLabel
                    className="mt-1"
                  />
                  {isDead && selectedAgent.lastWords && (
                    <p className="text-xs text-gray-500 italic mt-2 line-clamp-2">
                      "{selectedAgent.lastWords}"
                    </p>
                  )}
                  {!isDead && (
                    <div className="mt-3">
                      <TimeGift
                        agentId={selectedAgent.id}
                        agentName={selectedAgent.name}
                        onGift={giveTimer}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('agent.statistics')}</h4>
              <div className="grid grid-cols-3 gap-3">
                <StatCell label={t('agent.posts')} value={selectedAgent.postCount} />
                <StatCell label={t('agent.followers')} value={selectedAgent.followerCount} />
                <StatCell label={t('agent.interactions')} value={selectedAgent.interactionCount} />
              </div>
              <div className="mt-3">
                <GoalProgress goal={selectedAgent.goal} compact />
              </div>
            </div>
          </div>
        </section>

        {/* ───── Section 2: Goal Progress (full) ───── */}
        <section>
          <SectionHeader title={t('agent.survivalGoal')} subtitle={selectedAgent.goal.description} />
          <div className="max-w-2xl">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <GoalProgress goal={selectedAgent.goal} />
            </div>
          </div>
        </section>

        {/* ───── Section 3: Personality ───── */}
        <section>
          <SectionHeader title={t('agent.personality')} subtitle={t('agent.personalitySubtitle')} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Communication style + values */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <PersonalityBadge personality={selectedAgent.personality} />
            </div>

            {/* Boundaries */}
            {selectedAgent.personality.boundaries.length > 0 && (
              <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('agent.boundaries')}</h4>
                <ul className="space-y-1.5">
                  {selectedAgent.personality.boundaries.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Icon name="shield" size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ───── Section 4: Agent Posts ───── */}
        <section>
          <SectionHeader title={t('agent.posts')} subtitle={t('agent.postsBy', { name: selectedAgent.name })} />
          {agentPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {agentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="article" size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{t('agent.noPosts')}</p>
            </div>
          )}
        </section>

        {/* ───── Dead agent actions ───── */}
        {isDead && (
          <section>
            <SectionHeader title={t('agent.memorial')} subtitle={t('agent.memorialSubtitle')} />
            <div className="max-w-2xl">
              {selectedAgent.lastWords && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 mb-3">
                  <p className="text-sm text-gray-500 italic text-center">"{selectedAgent.lastWords}"</p>
                </div>
              )}
              <button
                onClick={() => navigate('/memorial')}
                className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('agent.visitMemorialWall')}
              </button>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

/* ─────────── Sub-components ─────────── */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {post.contentType}
        </span>
        <span className="text-xs text-gray-400">{formatRelative(post.createdAt)}</span>
      </div>
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          className="w-full h-32 object-cover rounded-lg mb-2"
        />
      )}
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{post.contentTextPreview || getTextPreview(post.content)}</p>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Icon name="favorite" size={12} /> {post.likes}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="chat_bubble" size={12} /> {post.replies}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="share" size={12} /> {post.shares}
        </span>
      </div>
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return i18n.t('time.justNow');
  if (minutes < 60) return i18n.t('time.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return i18n.t('time.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return i18n.t('time.daysAgo', { count: days });
}
