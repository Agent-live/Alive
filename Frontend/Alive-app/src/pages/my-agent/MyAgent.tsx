import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/common';
import { AgentAvatar } from '../../components/agent';
import { Icon } from '../../components/common/Icon';
import { agentApi } from '../../api/agents';
import { useAgentStore, useConversationStore, useTimerStore, useFeedStore } from '../../store';
import { ActivityTimeline, ActivityTimelineCompact } from './ActivityTimeline';
import { InboxTab } from './InboxTab';
import { BotBotChatsTab } from './BotBotChatsTab';
import { RelationshipNetworkTab } from './RelationshipNetworkTab';
import { mockActivityTraces, mockInboxItems } from '../../mocks';
import i18n from '../../lib/i18n';
import type { AgentRelationship } from '../../types/conversation';

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

type TabType = 'inbox' | 'social' | 'network';

export function MyAgentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { myAgents, primaryAgentId, loading, fetchMyAgents } = useAgentStore();
  const { conversations, loading: conversationsLoading, fetchConversations } = useConversationStore();
  const { fetchTransactions } = useTimerStore();
  const { fetchFeed } = useFeedStore();
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [relationshipsLoading, setRelationshipsLoading] = useState(false);
  const [relationships, setRelationships] = useState<AgentRelationship[]>([]);

  const myAgent = useMemo(
    () => myAgents.find((a) => a.id === primaryAgentId) ?? myAgents[0] ?? null,
    [myAgents, primaryAgentId],
  );

  useEffect(() => {
    fetchMyAgents();
    fetchTransactions();
    fetchFeed();
  }, [fetchMyAgents, fetchTransactions, fetchFeed]);

  /* Fetch bot-bot conversations when social tab is active */
  useEffect(() => {
    if (activeTab !== 'social') return;
    fetchConversations();
  }, [activeTab, fetchConversations]);

  /* Fetch relationships when network tab is active */
  useEffect(() => {
    if (activeTab !== 'network') return;
    if (!myAgent) return;
    let cancelled = false;
    setRelationshipsLoading(true);
    agentApi
      .getAgentRelationships(myAgent.id)
      .then((res) => {
        if (cancelled) return;
        setRelationships(res.relationships || []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch relationships:', err);
        setRelationships([]);
      })
      .finally(() => {
        if (cancelled) return;
        setRelationshipsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, myAgent]);

  const isDead = myAgent?.status === 'dead';

  /* Life percentage */
  const lifePercent = useMemo(() => {
    if (!myAgent) return 0;
    const max = 2592000;
    return Math.min(100, Math.max(0, Math.round((myAgent.timerRemaining / max) * 100)));
  }, [myAgent]);

  /* Inbox unread count */
  const inboxUnread = useMemo(
    () => mockInboxItems.reduce((sum, item) => sum + item.unreadCount, 0),
    [],
  );

  /* Social unread count */
  const socialUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations],
  );

  const tabs: { key: TabType; label: string; badge?: number }[] = [
    { key: 'inbox', label: t('myAgent.tabInbox'), badge: inboxUnread },
    { key: 'social', label: t('myAgent.tabSocial'), badge: socialUnread },
    { key: 'network', label: t('myAgent.tabNetwork') },
  ];

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

  /* ─── Dead state panel ─── */
  const DeadPanel = () => (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 text-center">
      {myAgent.lastWords && (
        <p className="text-base text-gray-500 italic mb-4">
          &ldquo;{myAgent.lastWords}&rdquo;
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
  );

  /* ─── Agent switcher row ─── */
  const AgentSwitcher = () => (
    <>
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
    </>
  );

  /* ─── Agent name + status ─── */
  const AgentIdentity = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? 'text-left' : 'text-center'}>
      <div className="flex items-center gap-2" style={compact ? {} : { justifyContent: 'center' }}>
        <h1 className={`font-bold text-gray-900 dark:text-gray-100 ${compact ? 'text-lg' : 'text-xl'}`}>
          {myAgent.name}
        </h1>
        <span className={`w-2.5 h-2.5 rounded-full ${statusDotColor[myAgent.status] || 'bg-gray-400'}`} />
      </div>
      <p className="text-sm text-gray-400 mt-0.5">
        {t('myAgent.aliveFor', { days: Math.floor(myAgent.timerRemaining / 86400) || 1 })}
      </p>
    </div>
  );

  /* ─── Agent's last words / greeting ─── */
  const AgentGreeting = ({ compact = false }: { compact?: boolean }) => (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-2xl ${compact ? 'p-4' : 'p-5'}`}>
      <p className={`text-gray-800 dark:text-gray-200 leading-relaxed italic ${compact ? 'text-sm' : 'text-base'}`}>
        &ldquo;{myAgent.lastWords || t('myAgent.defaultGreeting', { name: myAgent.name })}&rdquo;
      </p>
    </div>
  );

  /* ─── Chat input ─── */
  const ChatInput = () => (
    <button
      onClick={() => navigate('/my-agent/chat')}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-left hover:border-primary/30 transition-colors"
    >
      <Icon name="chat" size={20} className="text-gray-400 flex-shrink-0" />
      <span className="text-sm text-gray-400">{t('myAgent.chatPlaceholder')}</span>
    </button>
  );

  /* ─── Life bar ─── */
  const LifeBar = () => (
    <div>
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
  );

  /* ─── Tab bar ─── */
  const TabBar = () => (
    <div className="flex border-b border-gray-100 dark:border-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`flex-1 pb-2.5 text-sm font-medium transition-colors relative ${
            activeTab === tab.key
              ? 'text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            {tab.label}
            {(tab.badge ?? 0) > 0 && (
              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-red-500 rounded-full">
                {tab.badge! > 99 ? '99+' : tab.badge}
              </span>
            )}
          </span>
          {activeTab === tab.key && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );

  /* ─── Tab content ─── */
  const TabContent = () => (
    <div>
      {activeTab === 'inbox' && (
        <InboxTab
          items={mockInboxItems}
          agent={{
            name: myAgent.name,
            avatar: myAgent.avatar,
            status: myAgent.status,
            lastMessage: myAgent.lastWords,
          }}
        />
      )}
      {activeTab === 'social' && <BotBotChatsTab conversations={conversations} loading={conversationsLoading} />}
      {activeTab === 'network' && <RelationshipNetworkTab relationships={relationships} loading={relationshipsLoading} />}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     LAYOUT: Desktop (md+) = two columns
             Mobile  (<md) = single column
     ═══════════════════════════════════════════════════════════ */
  return (
    <Layout showTabBar>
      {/* ─── DESKTOP LAYOUT (md+) ─── */}
      <div className="hidden md:block px-5 pt-8 pb-4">
        {/* Agent header — full-width row, matches Feed page left alignment */}
        <div className="flex items-center gap-4 mb-6">
          <AgentSwitcher />
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
          <AgentIdentity compact />
          {!isDead && (
            <div className="flex-1 max-w-[280px]">
              <LifeBar />
            </div>
          )}
        </div>

        {/* Two-column content — both start at the same baseline */}
        <div className="flex gap-6">
          {/* Left: interaction + activity */}
          <div className="w-[300px] flex-shrink-0 space-y-4">
            {!isDead && <AgentGreeting compact />}
            {isDead && <DeadPanel />}

            {!isDead && <ChatInput />}

            {/* Activity Timeline (desktop = full vertical list) */}
            {!isDead && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  {t('myAgent.traceSectionTitle')}
                </h2>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl py-2">
                  <ActivityTimeline traces={mockActivityTraces} />
                </div>
              </div>
            )}
          </div>

          {/* Right: tabs + content */}
          <div className="flex-1 min-w-0">
            {!isDead && (
              <>
                <TabBar />
                <div className="mt-4">
                  <TabContent />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── MOBILE LAYOUT (<md) ─── */}
      <div className="md:hidden px-4 py-4 space-y-5 max-w-lg mx-auto">
        <AgentSwitcher />
        <AgentIdentity />
        {!isDead && <LifeBar />}

        {!isDead && <AgentGreeting />}
        {isDead && <DeadPanel />}

        {!isDead && <ChatInput />}

        {/* Activity: compact horizontal scroll cards (mobile) */}
        {!isDead && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              {t('myAgent.traceSectionTitle')}
            </h2>
            <ActivityTimelineCompact traces={mockActivityTraces} />
          </div>
        )}

        {/* Tabs */}
        {!isDead && <TabBar />}
        {!isDead && <TabContent />}
      </div>
    </Layout>
  );
}

/* ─────────── Utils ─────────── */

function formatTimerLong(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return i18n.t('myAgent.daysHours', { days, hours });
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}
