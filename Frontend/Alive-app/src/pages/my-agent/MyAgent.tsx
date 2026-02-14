import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

/* ─── Desktop detection (md = 768px) ─── */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

/* ─── Chat message type ─── */
interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
  timeCost?: number;
}

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
  const [chatOpen, setChatOpen] = useState(false);
  const isDesktop = useIsDesktop();

  /* Chat dialog state */
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatTyping, setChatTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

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
  const AgentIdentity = () => (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
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
  const AgentGreeting = () => (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed italic">
        &ldquo;{myAgent.lastWords || t('myAgent.defaultGreeting', { name: myAgent.name })}&rdquo;
      </p>
    </div>
  );

  /* ─── Open chat: dialog on desktop, navigate on mobile ─── */
  const openChat = useCallback(() => {
    if (isDesktop) {
      setChatOpen(true);
      // Initialize with greeting if empty
      if (chatMessages.length === 0 && myAgent) {
        setChatMessages([{
          id: 'msg_init',
          role: 'agent',
          text: myAgent.lastWords || t('myAgent.defaultGreeting', { name: myAgent.name }),
          timestamp: new Date().toISOString(),
        }]);
      }
    } else {
      navigate('/my-agent/chat');
    }
  }, [isDesktop, chatMessages.length, myAgent, t, navigate]);

  /* ─── Send chat message ─── */
  const handleChatSend = useCallback(() => {
    const text = chatInput.trim();
    if (!text || !myAgent) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatTyping(true);

    setTimeout(() => {
      const replies = [
        t('chat.mockReply1', { name: myAgent.name }),
        t('chat.mockReply2'),
        t('chat.mockReply3'),
        t('chat.mockReply4'),
        t('chat.mockReply5'),
      ];
      const agentMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toISOString(),
        timeCost: Math.ceil(Math.random() * 5) + 1,
      };
      setChatMessages((prev) => [...prev, agentMsg]);
      setChatTyping(false);
    }, 1000 + Math.random() * 2000);
  }, [chatInput, myAgent, t]);

  const handleChatKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  }, [handleChatSend]);

  /* Scroll chat to bottom */
  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  /* Focus input when dialog opens + ESC to close */
  useEffect(() => {
    if (!chatOpen) return;
    setTimeout(() => chatInputRef.current?.focus(), 100);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setChatOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [chatOpen]);

  /* ─── Chat input ─── */
  const ChatInput = () => (
    <button
      onClick={openChat}
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
          onAgentClick={isDesktop ? openChat : undefined}
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
        {/* Agent identity + life bar + switcher — single row */}
        <div className="flex items-center gap-4 mb-6">
          <AgentIdentity />
          {!isDead && (
            <div className="flex-1 max-w-[280px]">
              <LifeBar />
            </div>
          )}
          <div className="ml-auto">
            <AgentSwitcher />
          </div>
        </div>

        {/* Two-column content — both start at the same baseline */}
        <div className="flex gap-6">
          {/* Left: interaction + activity */}
          <div className="w-[300px] flex-shrink-0 space-y-4">
            {!isDead && <AgentGreeting />}
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

      {/* ─── DESKTOP CHAT DIALOG ─── */}
      {chatOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setChatOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" />

          {/* Dialog */}
          <div
            className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-950 rounded-2xl shadow-2xl flex flex-col animate-[scaleIn_200ms_ease-out]"
            style={{ height: 'min(600px, 80vh)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 h-14 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              {myAgent && <AgentAvatar avatar={myAgent.avatar} status={myAgent.status} size="sm" />}
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {myAgent.name}
                </h2>
                <p className="text-[11px] text-gray-400">
                  {isDead ? t('status.dead') : t('myAgent.aliveFor', { days: Math.floor(myAgent.timerRemaining / 86400) || 1 })}
                </p>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="close" size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'agent' && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden">
                        {myAgent.avatar ? (
                          <img src={myAgent.avatar} alt="" className="w-7 h-7 object-cover" />
                        ) : (
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">{myAgent.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <div
                        className={`rounded-2xl px-3.5 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <div className={`flex items-center gap-2 mt-0.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.timeCost != null && (
                          <span className="text-[10px] text-orange-400">-{msg.timeCost}min</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {chatTyping && (
                <div className="flex justify-start">
                  <div className="flex items-end gap-2">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden">
                      {myAgent.avatar ? (
                        <img src={myAgent.avatar} alt="" className="w-7 h-7 object-cover" />
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">{myAgent.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            {!isDead ? (
              <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-5 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder={t('myAgent.chatPlaceholder')}
                    rows={1}
                    className="flex-1 resize-none rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
                    style={{ minHeight: '40px' }}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim()}
                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
                  >
                    <Icon name="arrow_upward" size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-5 py-4 text-center">
                <p className="text-sm text-gray-400">{t('chat.agentDead')}</p>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
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
