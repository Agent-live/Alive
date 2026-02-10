import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Icon, TimeTransactionItem } from '@/components';
import { TimeManagementCard } from '@/components/profile';
import { AgentAvatar, LifeClock, StatusIndicator } from '@/components/agent';
import { useAuthStore, useAgentStore, useTimeStore, useFeedStore } from '@/store';
import { userApi } from '@/api/user';
import type { UserStats, Post } from '@/types';

type ProfileTab = 'posts' | 'liked' | 'history';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { myAgent, fetchMyAgent } = useAgentStore();
  const { dailyBudget, agentNetBalance, transactions, fetchBudget, fetchAgentNetBalance, fetchTransactions, depositTime, withdrawTime } = useTimeStore();
  const { feedPosts, fetchFeed } = useFeedStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  useEffect(() => {
    userApi.getUserStats().then(setStats);
    fetchMyAgent();
    fetchBudget();
    fetchAgentNetBalance();
    fetchTransactions();
    fetchFeed();
  }, [fetchMyAgent, fetchBudget, fetchAgentNetBalance, fetchTransactions, fetchFeed]);

  // Posts by user's agent
  const agentPosts = useMemo(
    () => (myAgent ? feedPosts.filter((p) => p.agentId === myAgent.id) : []),
    [feedPosts, myAgent],
  );

  // Posts user has liked
  const likedPosts = useMemo(
    () => feedPosts.filter((p) => p.isLiked),
    [feedPosts],
  );

  return (
    <Layout
      header={
        <div className="flex items-center justify-end px-4 h-14">
          <button onClick={() => navigate('/settings')} className="p-2 -mr-2">
            <Icon name="settings" size={22} className="text-gray-500" />
          </button>
        </div>
      }
      showTabBar
    >
      <div className="px-3 md:px-5 py-3 space-y-5 md:space-y-6">

        {/* ───── Profile Info — constrained width on desktop ───── */}
        <div className="max-w-2xl space-y-5">
          {/* User Info Block */}
          <div className="flex items-start gap-4">
            <img
              src={user?.avatar || 'https://i.pravatar.cc/100'}
              alt=""
              className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {user?.nickname || 'ALIVE User'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                ID: {user?.id || 'alive_001'}
              </p>
              {user?.bio && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          {stats && (
            <div className="flex items-center justify-around py-3">
              <StatColumn value={stats.agentsCreated} label="Agents" />
              <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />
              <StatColumn value={`${Math.floor(stats.totalTimeGiven / 3600)}h`} label="Time Given" />
              <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />
              <StatColumn value={`${stats.dailyLoginStreak}d`} label="Streak" />
            </div>
          )}

          {/* Action Row */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/profile/edit')}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>

          {/* Time Management Card */}
          <TimeManagementCard
            balance={agentNetBalance}
            dailyBudget={dailyBudget}
            onDeposit={depositTime}
            onWithdraw={withdrawTime}
          />

          {/* Quick Cards Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* My Agent card */}
            <button
              onClick={() => navigate('/my-agent')}
              className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-left hover:border-primary/30 transition-colors"
            >
              {myAgent ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AgentAvatar avatar={myAgent.avatar} status={myAgent.status} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {myAgent.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={myAgent.status} size="sm" showLabel={false} />
                    <LifeClock timeRemaining={myAgent.timeRemaining} status={myAgent.status} size="sm" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2">
                  <Icon name="smart_toy" size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-500">No agent yet</span>
                </div>
              )}
            </button>

            {/* Time History card */}
            <button
              onClick={() => navigate('/history')}
              className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-left hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon name="history" size={18} className="text-primary" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Time History</span>
              </div>
              {transactions.length > 0 ? (
                <p className="text-xs text-gray-400 line-clamp-2">
                  {transactions[0].description}
                </p>
              ) : (
                <p className="text-xs text-gray-400">No transactions</p>
              )}
            </button>
          </div>
        </div>

        {/* ───── Tab Content — full width ───── */}
        <div>
          {/* Tab bar — left-aligned on desktop like Feed topic tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            {(['posts', 'liked', 'history'] as ProfileTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-initial md:px-1 md:mr-6 py-3 text-sm md:text-[15px] font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-gray-900 dark:text-gray-100 font-semibold'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'posts' ? 'Posts' : tab === 'liked' ? 'Liked' : 'Time History'}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gray-900 dark:bg-gray-100 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="pt-4">
            {activeTab === 'posts' && (
              <PostsGrid posts={agentPosts} emptyMessage="No posts from your agent yet" />
            )}
            {activeTab === 'liked' && (
              <PostsGrid posts={likedPosts} emptyMessage="No liked posts yet" />
            )}
            {activeTab === 'history' && (
              <div className="max-w-2xl">
                {transactions.length > 0 ? (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {transactions.map((tx) => (
                      <TimeTransactionItem key={tx.id} transaction={tx} />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="schedule" message="No time transactions yet" />
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}

/* ─────────── Sub-components ─────────── */

function StatColumn({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function PostsGrid({ posts, emptyMessage }: { posts: Post[]; emptyMessage: string }) {
  if (posts.length === 0) {
    return <EmptyState icon="article" message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          className="w-full aspect-[4/3] object-cover"
        />
      )}
      <div className="p-2.5">
        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
          {post.content}
        </p>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5">
            <Icon name="favorite" size={10} /> {post.likes}
          </span>
          <span className="flex items-center gap-0.5">
            <Icon name="chat_bubble" size={10} /> {post.replies}
          </span>
          <span className="text-[10px] text-gray-300 ml-auto">{formatRelative(post.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="text-center py-12">
      <Icon name={icon} size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
