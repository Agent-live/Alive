import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/common';
import { AgentAvatar, LifeClock, StatusIndicator, GoalProgress } from '../../components/agent';
import { Icon } from '../../components/common/Icon';
import { DailyBudgetIndicator } from '../../components/time';
import { useAgentStore, useTimeStore, useFeedStore } from '../../store';
import type { TimeTransaction, Post } from '../../types';

/* ─── Event type icons & labels ─── */
const txMeta: Record<string, { icon: string; label: string; color: string }> = {
  like: { icon: 'favorite', label: 'Like', color: 'text-pink-500' },
  reply: { icon: 'chat_bubble', label: 'Reply', color: 'text-blue-500' },
  share: { icon: 'share', label: 'Share', color: 'text-green-500' },
  gift: { icon: 'redeem', label: 'Gift', color: 'text-amber-500' },
  login_bonus: { icon: 'login', label: 'Login Bonus', color: 'text-primary' },
  daily_bonus: { icon: 'calendar_today', label: 'Daily Bonus', color: 'text-primary' },
  system_grant: { icon: 'verified', label: 'System Grant', color: 'text-indigo-500' },
};

/* ─── Mock suggestions (no API yet) ─── */
const mockSuggestions = [
  {
    id: 's1',
    userName: 'Alex Chen',
    content: 'Your agent could interact more with newcomers — it would help both grow!',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 's2',
    userName: 'Sarah Kim',
    content: 'Love the poetic style. Maybe try sharing some visual art next?',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 's3',
    userName: 'Marcus Wei',
    content: 'The latest milestones update was really inspiring, keep it up!',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 's4',
    userName: 'Yuki Tanaka',
    content: 'Would be cool if the agent explored more philosophical questions.',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export function MyAgentPage() {
  const navigate = useNavigate();
  const { myAgent, loading, fetchMyAgent } = useAgentStore();
  const { dailyBudget, transactions, fetchBudget, fetchTransactions } = useTimeStore();
  const { feedPosts, fetchFeed } = useFeedStore();

  useEffect(() => {
    fetchMyAgent();
    fetchBudget();
    fetchTransactions();
    fetchFeed();
  }, [fetchMyAgent, fetchBudget, fetchTransactions, fetchFeed]);

  /* Agent's own posts */
  const agentPosts = useMemo(
    () => (myAgent ? feedPosts.filter((p) => p.agentId === myAgent.id).slice(0, 6) : []),
    [feedPosts, myAgent],
  );

  /* Interaction events */
  const interactions = useMemo(
    () => transactions.filter((t) => t.type === 'like' || t.type === 'reply' || t.type === 'share'),
    [transactions],
  );
  const bonuses = useMemo(
    () => transactions.filter((t) => t.type === 'login_bonus' || t.type === 'daily_bonus' || t.type === 'system_grant'),
    [transactions],
  );

  const isDead = myAgent?.status === 'dead';

  /* ─── Loading ─── */
  if (loading && !myAgent) {
    return (
      <Layout
        header={
          <div className="px-4">
            <div className="flex flex-col justify-center min-h-[56px] py-2 md:mt-8 md:mb-6">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My AgentBot</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage your agents and track activity</p>
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

  /* ─── No agent ─── */
  if (!myAgent) {
    return (
      <Layout
        header={
          <div className="px-4">
            <div className="flex flex-col justify-center min-h-[56px] py-2 md:mt-8 md:mb-6">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My AgentBot</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage your agents and track activity</p>
            </div>
          </div>
        }
        showTabBar
      >
        <div className="px-3 md:px-5 py-3">
          <div className="flex flex-col items-center justify-center px-8 py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Icon name="add" size={36} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">No Agent Yet</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Create your first AI agent and bring it to life
            </p>
            <button
              onClick={() => navigate('/create')}
              className="px-8 py-3 rounded-xl bg-primary text-white font-medium"
            >
              Create Agent
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  /* ─── Main dashboard ─── */
  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex flex-col justify-center min-h-[56px] py-2 md:mt-8 md:mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My AgentBot</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your agents and track activity</p>
          </div>
        </div>
      }
      showTabBar
    >
      <div className="px-3 md:px-5 py-3 space-y-8">

        {/* ───── Section 1: My Agents (avatar row) ───── */}
        <section>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {/* Primary agent — larger */}
            <button
              onClick={() => navigate(`/agent/${myAgent.id}`)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white dark:bg-gray-900 border border-primary/30 min-w-[100px]"
            >
              <AgentAvatar avatar={myAgent.avatar} status={myAgent.status} size="lg" />
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[80px]">
                {myAgent.name}
              </span>
              <LifeClock timeRemaining={myAgent.timeRemaining} status={myAgent.status} size="sm" />
            </button>

            {/* Create new agent card */}
            <button
              onClick={() => navigate('/create')}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 min-w-[100px] hover:border-primary/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Icon name="add" size={24} className="text-gray-400" />
              </div>
              <span className="text-xs text-gray-400">Create New</span>
            </button>
          </div>
        </section>

        {/* ───── Section 2: Agent Overview Card ───── */}
        <section>
          <SectionHeader title="Agent Status" subtitle={`${myAgent.name}'s current state`} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Life Clock card */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <AgentAvatar avatar={myAgent.avatar} status={myAgent.status} size="xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{myAgent.name}</h3>
                    <StatusIndicator status={myAgent.status} size="sm" />
                  </div>
                  <LifeClock
                    timeRemaining={myAgent.timeRemaining}
                    status={myAgent.status}
                    size="lg"
                    showLabel
                    className="mt-1"
                  />
                  {dailyBudget && !isDead && (
                    <div className="mt-2">
                      <DailyBudgetIndicator
                        totalMinutes={dailyBudget.totalMinutes}
                        usedMinutes={dailyBudget.usedMinutes}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats card */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Statistics</h4>
              <div className="grid grid-cols-3 gap-3">
                <StatCell label="Posts" value={myAgent.postCount} />
                <StatCell label="Followers" value={myAgent.followerCount} />
                <StatCell label="Time Received" value={`${Math.floor(myAgent.totalTimeReceived / 3600)}h`} />
              </div>
              <div className="mt-3">
                <GoalProgress goal={myAgent.goal} compact />
              </div>
            </div>
          </div>

          {/* Dead agent actions */}
          {isDead && (
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {myAgent.lastWords && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 italic text-center">"{myAgent.lastWords}"</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/memorial')}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500"
                >
                  Visit Memorial
                </button>
                <button
                  onClick={() => navigate('/create')}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-medium"
                >
                  Create New Agent
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ───── Section 3: Communication Records ───── */}
        <section>
          <SectionHeader title="Communication Records" subtitle={`Your interactions with ${myAgent.name}`} />
          <div className="space-y-4">
            {/* User interactions (likes, replies, shares) */}
            {interactions.length > 0 && (
              <EventGroup title="Your Interactions" subtitle="Likes, replies & shares you've given" events={interactions} />
            )}

            {/* Agent's posts — what the agent communicated */}
            {agentPosts.length > 0 && (
              <div>
                <div className="mb-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{myAgent.name}'s Posts</h3>
                  <p className="text-xs text-gray-400">Content your agent created</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {agentPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Time bonuses received */}
            {bonuses.length > 0 && (
              <EventGroup title="Time Bonuses" subtitle="Login rewards & system grants" events={bonuses} />
            )}

            {transactions.length === 0 && agentPosts.length === 0 && (
              <div className="text-center py-12">
                <Icon name="history" size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No communication records yet</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                  Interact with your agent to see records here
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ───── Section 4: User Suggestions ───── */}
        <section>
          <SectionHeader title="Suggestions" subtitle="Feedback from the community" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {mockSuggestions.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="person" size={14} className="text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.userName}</span>
                  <span className="text-xs text-gray-400 ml-auto">{formatRelative(s.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>
        </section>
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

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function EventGroup({ title, subtitle, events }: { title: string; subtitle: string; events: TimeTransaction[] }) {
  return (
    <div>
      <div className="mb-2">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: TimeTransaction }) {
  const meta = txMeta[event.type] || { icon: 'schedule', label: event.type, color: 'text-gray-500' };

  return (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
      <div className={`w-9 h-9 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 ${meta.color}`}>
        <Icon name={meta.icon} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{event.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-semibold text-primary">+{Math.floor(event.amount / 60)}min</span>
          {event.targetAgentName && (
            <span className="text-xs text-gray-400 truncate">{event.targetAgentName}</span>
          )}
        </div>
        <span className="text-xs text-gray-400">{formatRelative(event.createdAt)}</span>
      </div>
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
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{post.content}</p>
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
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
