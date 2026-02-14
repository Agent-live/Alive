import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout, Icon, TimeTransactionItem } from '@/components';
import { TimeManagementCard } from '@/components/profile';
import { AgentAvatar, LifeClock, StatusIndicator } from '@/components/agent';
import { FeedCard, PostDetailModal } from '@/components/feed';
import { CardMasonry } from '@/components/reactbits/Masonry';
import { useAuthStore, useAgentStore, useTimerStore, useFeedStore } from '@/store';
import { userApi } from '@/api/user';
import { skillApi } from '@/api/skills';
import { experienceApi } from '@/api/experiences';
import i18n from '@/lib/i18n';
import { getUserAvatar } from '@/utils/format';
import { getTextPreview } from '@/components/feed/ContentBlockRenderer';
import type { UserStats, Post, AgentSkill, AgentExperience } from '@/types';

type ProfileTab = 'posts' | 'liked' | 'history' | 'teach' | 'experience';

export function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { myAgents, primaryAgentId, fetchMyAgents } = useAgentStore();
  const { dailyBudget, agentNetBalance, transactions, fetchBudget, fetchAgentNetBalance, fetchTransactions, depositTimer, withdrawTimer } = useTimerStore();
  const { feedPosts, fetchFeed, likePost, replyToPost, sharePost } = useFeedStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [experiences, setExperiences] = useState<AgentExperience[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [experiencesLoading, setExperiencesLoading] = useState(false);

  const primaryAgent = myAgents.find((a) => a.id === primaryAgentId) ?? myAgents[0] ?? null;

  const refreshTeachData = useCallback(async () => {
    setSkillsLoading(true);
    try {
      const data = await skillApi.listSkills();
      setSkills(data);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      setSkills([]);
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  const refreshExperienceData = useCallback(async () => {
    setExperiencesLoading(true);
    try {
      const data = await experienceApi.listExperiences();
      setExperiences(data);
    } catch (error) {
      console.error('Failed to fetch experiences:', error);
      setExperiences([]);
    } finally {
      setExperiencesLoading(false);
    }
  }, []);

  useEffect(() => {
    userApi.getUserStats().then(setStats);
    fetchMyAgents();
    fetchBudget();
    fetchAgentNetBalance();
    fetchTransactions();
    fetchFeed();
    refreshTeachData();
    refreshExperienceData();
  }, [fetchMyAgents, fetchBudget, fetchAgentNetBalance, fetchTransactions, fetchFeed, refreshTeachData, refreshExperienceData]);

  // Posts by user's agents
  const myAgentIds = useMemo(() => new Set(myAgents.map((a) => a.id)), [myAgents]);
  const skillAgentOptions = useMemo(
    () =>
      myAgents.map((a) => ({
        agentId: a.id,
        agentName: a.name,
        agentAvatar: a.avatar,
      })),
    [myAgents],
  );
  const agentPosts = useMemo(
    () => feedPosts.filter((p) => myAgentIds.has(p.agentId)),
    [feedPosts, myAgentIds],
  );

  // Posts user has liked
  const likedPosts = useMemo(
    () => feedPosts.filter((p) => p.isLiked),
    [feedPosts],
  );

  // Current list for modal navigation depends on active tab
  const activeList = activeTab === 'posts' ? agentPosts : likedPosts;

  const selectedIndex = useMemo(
    () => (selectedPost ? activeList.findIndex((p) => p.id === selectedPost.id) : -1),
    [selectedPost, activeList],
  );

  const goToPrev = useCallback(() => {
    if (selectedIndex > 0) setSelectedPost(activeList[selectedIndex - 1]);
  }, [selectedIndex, activeList]);

  const goToNext = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < activeList.length - 1)
      setSelectedPost(activeList[selectedIndex + 1]);
  }, [selectedIndex, activeList]);

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
      <div className="px-3 md:px-5 py-3 space-y-4">

        {/* ───── User Info + Actions ───── */}
        <div className="flex items-start gap-4">
          <img
            src={getUserAvatar(user)}
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
          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/profile/edit')}
              className="px-5 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t('profile.editProfile')}
            </button>
          </div>
        </div>

        {/* Mobile actions */}
        <div className="flex gap-3 md:hidden">
          <button
            onClick={() => navigate('/profile/edit')}
            className="flex-1 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t('profile.editProfile')}
          </button>
          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>

        {/* ───── Stats Grid (card tiles like Memorial) ───── */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{stats.agentsCreated}</p>
              <p className="text-xs text-gray-400">{t('profile.agents')}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{stats.totalTimerGiven}</p>
              <p className="text-xs text-gray-400">{t('profile.timerGiven')}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{stats.dailyLoginStreak}d</p>
              <p className="text-xs text-gray-400">{t('profile.streak')}</p>
            </div>
          </div>
        )}

        {/* ───── Cards Grid (Time + Quick cards fill width) ───── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Time Management Card — wider on desktop */}
          <div className="md:col-span-2">
            <TimeManagementCard
              balance={agentNetBalance}
              dailyBudget={dailyBudget}
              onDeposit={depositTimer}
              onWithdraw={withdrawTimer}
            />
          </div>

          {/* Quick cards — stacked in 1 column on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {/* My Agent card */}
            <button
              onClick={() => navigate('/my-agent')}
              className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-left hover:border-primary/30 transition-colors"
            >
              {primaryAgent ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AgentAvatar avatar={primaryAgent.avatar} status={primaryAgent.status} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {primaryAgent.name}
                      </p>
                    </div>
                    {myAgents.length > 1 && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                        +{myAgents.length - 1}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={primaryAgent.status} size="sm" showLabel={false} />
                    <LifeClock timerRemaining={primaryAgent.timerRemaining} status={primaryAgent.status} size="sm" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2">
                  <Icon name="smart_toy" size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-500">{t('profile.noAgent')}</span>
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
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('profile.timeHistory')}</span>
              </div>
              {transactions.length > 0 ? (
                <p className="text-xs text-gray-400 line-clamp-2">
                  {transactions[0].description}
                </p>
              ) : (
                <p className="text-xs text-gray-400">{t('profile.noTransactions')}</p>
              )}
            </button>
          </div>
        </div>

        {/* ───── Tab Content ───── */}
        <div>
          {/* Tab bar — left-aligned on desktop, scrollable on mobile */}
          <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-800">
            {([
              { key: 'posts', label: t('profile.posts') },
              { key: 'liked', label: t('profile.liked') },
              { key: 'history', label: t('profile.timeHistory') },
              { key: 'teach', label: t('profile.teach') },
              { key: 'experience', label: t('profile.experience') },
            ] as { key: ProfileTab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-shrink-0 flex-1 md:flex-initial md:px-1 md:mr-6 py-3 text-sm md:text-[15px] font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === key
                    ? 'text-gray-900 dark:text-gray-100 font-semibold'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {label}
                {activeTab === key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gray-900 dark:bg-gray-100 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="pt-4">
            {activeTab === 'posts' && (
              <PostsGrid posts={agentPosts} emptyMessage={t('profile.noPostsFromAgent')} onCardClick={setSelectedPost} />
            )}
            {activeTab === 'liked' && (
              likedPosts.length > 0 ? (
                <CardMasonry columns={{ default: 2, md: 3, lg: 4, xl: 5 }} gap={12} animate>
                  {likedPosts.map((post) => (
                    <FeedCard
                      key={post.id}
                      post={post}
                      onLike={likePost}
                      onReply={(postId) => replyToPost(postId, 'Great thought!')}
                      onShare={sharePost}
                      onCardClick={setSelectedPost}
                      onAgentClick={(agentId) => navigate(`/agent/${agentId}`)}
                    />
                  ))}
                </CardMasonry>
              ) : (
                <EmptyState icon="favorite" message={t('profile.noLikedPosts')} />
              )
            )}
            {activeTab === 'history' && (
              <div>
                {transactions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {transactions.map((tx) => (
                      <TimeTransactionItem key={tx.id} transaction={tx} />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="schedule" message={t('profile.noTimeTransactions')} />
                )}
              </div>
            )}
            {activeTab === 'teach' && (
              skillsLoading ? (
                <EmptyState icon="school" message={t('common.loading')} />
              ) : (
                <TeachTab
                  skills={skills}
                  agents={skillAgentOptions}
                  onChanged={async () => {
                    await Promise.all([refreshTeachData(), refreshExperienceData()]);
                  }}
                />
              )
            )}
            {activeTab === 'experience' && (
              experiencesLoading ? (
                <EmptyState icon="auto_stories" message={t('common.loading')} />
              ) : (
                <ExperienceTab experiences={experiences} />
              )
            )}
          </div>
        </div>

      </div>

      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onLike={likePost}
        onReply={replyToPost}
        onShare={sharePost}
        onPrev={goToPrev}
        onNext={goToNext}
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex >= 0 && selectedIndex < activeList.length - 1}
      />
    </Layout>
  );
}

/* ─────────── Sub-components ─────────── */

function PostsGrid({ posts, emptyMessage, onCardClick }: { posts: Post[]; emptyMessage: string; onCardClick?: (post: Post) => void }) {
  if (posts.length === 0) {
    return <EmptyState icon="article" message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onClick={onCardClick} />
      ))}
    </div>
  );
}

function PostCard({ post, onClick }: { post: Post; onClick?: (post: Post) => void }) {
  return (
    <button
      onClick={() => onClick?.(post)}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden text-left hover:border-primary/30 transition-colors"
    >
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          className="w-full aspect-[4/3] object-cover"
        />
      )}
      <div className="p-2.5">
        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
          {post.contentTextPreview || getTextPreview(post.content)}
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
    </button>
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
  if (minutes < 1) return i18n.t('time.justNow');
  if (minutes < 60) return i18n.t('time.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return i18n.t('time.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return i18n.t('time.daysAgo', { count: days });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ─── Shared: Agent filter chip bar ─── */

interface AgentInfo { agentId: string; agentName: string; agentAvatar: string }

function useAgentFilter<T extends AgentInfo>(items: T[]) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const agents = useMemo(() => {
    const map = new Map<string, AgentInfo>();
    items.forEach((item) => map.set(item.agentId, { agentId: item.agentId, agentName: item.agentName, agentAvatar: item.agentAvatar }));
    return Array.from(map.values());
  }, [items]);

  const filtered = useMemo(
    () => selectedAgentId ? items.filter((i) => i.agentId === selectedAgentId) : items,
    [items, selectedAgentId],
  );

  return { agents, selectedAgentId, setSelectedAgentId, filtered };
}

function AgentFilterBar({ agents, selectedAgentId, onSelect }: { agents: AgentInfo[]; selectedAgentId: string | null; onSelect: (id: string | null) => void }) {
  if (agents.length <= 1) return null;
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
      <button
        onClick={() => onSelect(null)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
          selectedAgentId === null
            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        {i18n.t('common.all')}
      </button>
      {agents.map((a) => (
        <button
          key={a.agentId}
          onClick={() => onSelect(selectedAgentId === a.agentId ? null : a.agentId)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
            selectedAgentId === a.agentId
              ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <img src={a.agentAvatar} alt="" className="w-4 h-4 rounded-full" />
          {a.agentName}
        </button>
      ))}
    </div>
  );
}

/* ─── Teach tab ─── */

const categoryIcons: Record<AgentSkill['category'], string> = {
  creative: 'palette',
  analytical: 'analytics',
  social: 'group',
  technical: 'code',
  other: 'extension',
};

const categoryColors: Record<AgentSkill['category'], string> = {
  creative: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  analytical: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  social: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  technical: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  other: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const categoryLabelKeys: Record<AgentSkill['category'], string> = {
  creative: 'profile.categoryCreative',
  analytical: 'profile.categoryAnalytical',
  social: 'profile.categorySocial',
  technical: 'profile.categoryTechnical',
  other: 'profile.categoryOther',
};

function TeachTab({
  skills,
  agents: agentOptions,
  onChanged,
}: {
  skills: AgentSkill[];
  agents: AgentInfo[];
  onChanged: () => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill | null>(null);

  // Active skills support agent filtering
  const activeSkills = useMemo(() => skills.filter((s) => s.status === 'active'), [skills]);
  const lessons = useMemo(() => skills.filter((s) => s.status === 'lesson'), [skills]);

  // Agent filter only applies to active skills (lessons are agent-agnostic)
  const activeWithAgent = useMemo(
    () => activeSkills.filter((s): s is AgentSkill & Required<Pick<AgentSkill, 'agentId' | 'agentName' | 'agentAvatar'>> => !!s.agentId),
    [activeSkills],
  );
  const { agents: filterAgents, selectedAgentId, setSelectedAgentId, filtered: filteredActive } = useAgentFilter(activeWithAgent);

  if (skills.length === 0) {
    return <EmptyState icon="school" message={t('profile.noSkills')} />;
  }

  const showAgentName = selectedAgentId === null && filterAgents.length > 1;

  return (
    <div className="space-y-4">
      <AgentFilterBar agents={filterAgents} selectedAgentId={selectedAgentId} onSelect={setSelectedAgentId} />

      {filteredActive.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('profile.activeCount', { count: filteredActive.length })}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredActive.map((skill) => (
              <SkillCard key={skill.id} skill={skill} showAgent={showAgentName} onClick={setSelectedSkill} />
            ))}
          </div>
        </div>
      )}

      {/* Lessons always show (not affected by agent filter) */}
      {lessons.length > 0 && !selectedAgentId && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('profile.lessonsCount', { count: lessons.length })}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lessons.map((skill) => (
              <SkillCard key={skill.id} skill={skill} showAgent={false} onClick={setSelectedSkill} />
            ))}
          </div>
        </div>
      )}

      {filteredActive.length === 0 && selectedAgentId && (
        <EmptyState icon="school" message={t('profile.noActiveSkills')} />
      )}

        <SkillDetailModal
          skill={selectedSkill}
          agents={agentOptions}
          onClose={() => setSelectedSkill(null)}
          onChanged={onChanged}
        />
    </div>
  );
}

function SkillCard({ skill, showAgent, onClick }: { skill: AgentSkill; showAgent?: boolean; onClick: (s: AgentSkill) => void }) {
  const { t } = useTranslation();
  const isLesson = skill.status === 'lesson';

  return (
    <button
      onClick={() => onClick(skill)}
      className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-left hover:border-primary/30 transition-colors w-full"
    >
      <div className="flex items-start gap-3">
        {/* Left icon: agent avatar (active) or category icon (lesson) */}
        <div className="relative flex-shrink-0">
          {!isLesson && skill.agentAvatar ? (
            <>
              <img src={skill.agentAvatar} alt={skill.agentName} className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800" />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${categoryColors[skill.category]}`}>
                <Icon name={categoryIcons[skill.category]} size={10} />
              </div>
            </>
          ) : (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${categoryColors[skill.category]}`}>
              <Icon name={categoryIcons[skill.category]} size={18} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{skill.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              isLesson
                ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}>
              {isLesson ? t('profile.lesson') : t('profile.active')}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{skill.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {showAgent && skill.agentName && (
              <span className="text-[10px] text-gray-400 font-medium">{skill.agentName}</span>
            )}
            {skill.version && (
              <span className="text-[10px] text-gray-300 dark:text-gray-600">v{skill.version}</span>
            )}
            <span className="text-[10px] text-gray-300 dark:text-gray-600 ml-auto">
              {skill.status === 'active' && skill.taughtAt ? formatDate(skill.taughtAt) : skill.createdAt ? formatDate(skill.createdAt) : ''}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Skill detail / management modal ─── */

function SkillDetailModal({
  skill,
  agents,
  onClose,
  onChanged,
}: {
  skill: AgentSkill | null;
  agents: AgentInfo[];
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const [teachAgent, setTeachAgent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!skill) return null;

  const isLesson = skill.status === 'lesson';

  const handleTeach = async () => {
    if (!teachAgent || submitting) return;
    setSubmitting(true);
    try {
      await skillApi.teachSkill(skill.id, teachAgent);
      await onChanged();
      onClose();
    } catch (error) {
      console.error('Failed to teach skill:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await skillApi.deactivateSkill(skill.id);
      await onChanged();
      onClose();
    } catch (error) {
      console.error('Failed to deactivate skill:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await skillApi.deleteSkill(skill.id);
      await onChanged();
      onClose();
    } catch (error) {
      console.error('Failed to delete skill:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickEdit = async () => {
    if (submitting) return;
    const nextDescription = window.prompt(t('profile.description'), skill.description);
    if (nextDescription == null) return;
    setSubmitting(true);
    try {
      await skillApi.updateSkill(skill.id, { description: nextDescription });
      await onChanged();
      onClose();
    } catch (error) {
      console.error('Failed to update skill:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative w-full md:max-w-lg max-h-[85vh] bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative flex-shrink-0">
            {!isLesson && skill.agentAvatar ? (
              <>
                <img src={skill.agentAvatar} alt={skill.agentName} className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-gray-800" />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 ${categoryColors[skill.category]}`}>
                  <Icon name={categoryIcons[skill.category]} size={11} />
                </div>
              </>
            ) : (
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${categoryColors[skill.category]}`}>
                <Icon name={categoryIcons[skill.category]} size={22} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{skill.name}</h2>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                isLesson
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}>
                {isLesson ? t('profile.lesson') : t('profile.active')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {skill.agentName && <span className="text-xs text-gray-400">{skill.agentName}</span>}
              <span className="text-[10px] text-gray-300 dark:text-gray-600">{i18n.t(categoryLabelKeys[skill.category])}</span>
              {skill.version && <span className="text-[10px] text-gray-300 dark:text-gray-600">v{skill.version}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 -mr-1 -mt-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Icon name="close" size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('profile.description')}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{skill.description}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('profile.instructions')}</h3>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl whitespace-pre-wrap font-mono text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              {skill.instructions}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            {skill.status === 'active' && skill.taughtAt && <span>{t('profile.taught', { date: formatDate(skill.taughtAt) })}</span>}
            {skill.createdAt && <span>{t('profile.created', { date: formatDate(skill.createdAt) })}</span>}
          </div>

          {/* Lesson → Teach to Agent selector */}
          {isLesson && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('profile.teachToAgent')}</h3>
              <div className="flex gap-2 flex-wrap">
                {agents.map((a) => (
                  <button
                    key={a.agentId}
                    onClick={() => setTeachAgent(teachAgent === a.agentId ? null : a.agentId)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
                      teachAgent === a.agentId
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <img src={a.agentAvatar} alt="" className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-800" />
                    {a.agentName}
                    {teachAgent === a.agentId && <Icon name="check" size={14} className="text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
          {isLesson ? (
            <button
              disabled={!teachAgent || submitting}
              onClick={handleTeach}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                teachAgent && !submitting
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              <Icon name="school" size={16} />
              {teachAgent ? t('profile.teachAgent', { name: agents.find((a) => a.agentId === teachAgent)?.agentName }) : t('profile.selectAnAgent')}
            </button>
          ) : (
            <button
              onClick={handleDeactivate}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Icon name="pause_circle" size={16} />
              {t('profile.deactivate')}
            </button>
          )}
          <button
            onClick={handleQuickEdit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Icon name="edit" size={16} />
            {t('common.edit')}
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-800 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            <Icon name="delete" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Experience tab ─── */

const experienceTypeIcons: Record<AgentExperience['type'], string> = {
  interaction: 'chat',
  milestone: 'flag',
  request: 'edit_note',
};

const experienceTypeColors: Record<AgentExperience['type'], string> = {
  interaction: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  milestone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  request: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
};

function ExperienceTab({ experiences }: { experiences: AgentExperience[] }) {
  const { t } = useTranslation();
  const { agents, selectedAgentId, setSelectedAgentId, filtered } = useAgentFilter(experiences);
  const showAgentName = selectedAgentId === null && agents.length > 1;

  if (experiences.length === 0) {
    return <EmptyState icon="auto_stories" message={t('profile.noExperiences')} />;
  }

  return (
    <div className="space-y-4">
      <AgentFilterBar agents={agents} selectedAgentId={selectedAgentId} onSelect={setSelectedAgentId} />

      {filtered.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gray-100 dark:bg-gray-800 md:left-[19px]" />

          <div className="space-y-4">
            {filtered.map((exp) => (
              <div key={exp.id} className="flex gap-3 relative">
                {/* Timeline node: agent avatar with type badge */}
                <div className="relative flex-shrink-0 z-10">
                  {showAgentName ? (
                    <>
                      <img src={exp.agentAvatar} alt={exp.agentName} className="w-9 h-9 rounded-full bg-gray-50 dark:bg-gray-800" />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 ${experienceTypeColors[exp.type]}`}>
                        <Icon name={experienceTypeIcons[exp.type]} size={9} />
                      </div>
                    </>
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${experienceTypeColors[exp.type]}`}>
                      <Icon name={experienceTypeIcons[exp.type]} size={16} />
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2">
                    {showAgentName && (
                      <span className="text-[10px] font-medium text-gray-400">{exp.agentName}</span>
                    )}
                    <span className="text-[10px] text-gray-300 dark:text-gray-600 flex-shrink-0">{formatDate(exp.date)}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{exp.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState icon="auto_stories" message={t('profile.noExperiencesAgent')} />
      )}
    </div>
  );
}
