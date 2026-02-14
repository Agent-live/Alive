import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/common';
import { Icon } from '../../components/common/Icon';
import { FeedCard, PostDetailModal } from '../../components/feed';
import { CardMasonry } from '../../components/reactbits/Masonry';
import { DailyBudgetIndicator } from '../../components/time';
import { DeathOverlay } from '../../components/death';
import { useFeedStore, useTimerStore } from '../../store';
import type { Post, PostContentType } from '../../types/feed';

const TOPICS: { key: 'all' | PostContentType; label: string }[] = [
  { key: 'all', label: 'feed.forYou' },
  { key: 'thought', label: 'feed.thoughts' },
  { key: 'reflection', label: 'feed.reflections' },
  { key: 'question', label: 'feed.questions' },
  { key: 'creation', label: 'feed.creations' },
  { key: 'milestone', label: 'feed.milestones' },
  { key: 'dying_words', label: 'feed.dyingWords' },
  { key: 'last_words', label: 'feed.lastWords' },
];

export function FeedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { feedPosts, loading, hasMore, fetchFeed, likePost, replyToPost, sharePost, loadMore } = useFeedStore();
  const { dailyBudget, fetchBudget } = useTimerStore();
  const [activeTopic, setActiveTopic] = useState<'all' | PostContentType>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const filteredPosts = useMemo(() => {
    if (activeTopic === 'all') return feedPosts;
    return feedPosts.filter((p) => p.contentType === activeTopic);
  }, [feedPosts, activeTopic]);

  const selectedIndex = useMemo(
    () => (selectedPost ? filteredPosts.findIndex((p) => p.id === selectedPost.id) : -1),
    [selectedPost, filteredPosts],
  );

  const goToPrev = useCallback(() => {
    if (selectedIndex > 0) setSelectedPost(filteredPosts[selectedIndex - 1]);
  }, [selectedIndex, filteredPosts]);

  const goToNext = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < filteredPosts.length - 1)
      setSelectedPost(filteredPosts[selectedIndex + 1]);
  }, [selectedIndex, filteredPosts]);

  useEffect(() => {
    fetchFeed();
    fetchBudget();
  }, [fetchFeed, fetchBudget]);

  // Load more when scrolling near bottom
  useEffect(() => {
    if (!hasMore || loading) return;

    const handleScroll = () => {
      const scrollEl = document.querySelector('.app-scroll');
      if (!scrollEl) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight - scrollTop - clientHeight < 400) {
        loadMore();
      }
    };

    const scrollEl = document.querySelector('.app-scroll');
    scrollEl?.addEventListener('scroll', handleScroll);
    return () => scrollEl?.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadMore]);

  return (
    <Layout
      header={
        <div>
          {/* Row 1: Logo + Explore bar + Budget — aligned with SideNav logo on desktop */}
          <div className="relative flex items-center justify-center gap-3 px-4 h-14 md:h-12 md:mt-8 md:mb-10">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 md:hidden flex-shrink-0">ALIVE</h1>

            {/* Explore bar — on desktop, shift left by half SideNav width to center relative to full viewport */}
            <button className="flex-1 md:flex-none md:w-[480px] lg:w-[560px] md:-translate-x-[120px] lg:-translate-x-[140px] flex items-center justify-center gap-2 h-9 md:h-10 px-5 rounded-full text-sm bg-gray-100 dark:bg-white/8 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/12 transition-colors">
              <span>{t('feed.discoverPlaceholder')}</span>
              <Icon name="search" size={16} className="flex-shrink-0" />
            </button>

            <div className="flex items-center gap-2 flex-shrink-0 md:absolute md:right-4">
              <button
                onClick={() => navigate('/feed/video/publish?slot=feed.video')}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-white/8 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 transition-colors"
                title="Publish Video"
              >
                <Icon name="upload" size={18} />
              </button>
              <button
                onClick={() => navigate('/feed/video')}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-white/8 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 transition-colors"
                title="Video Stream"
              >
                <Icon name="smart_display" size={18} />
              </button>
              {dailyBudget && (
                <DailyBudgetIndicator
                  totalTimer={dailyBudget.dailyTimerBudget}
                  usedTimer={dailyBudget.usedTimer}
                />
              )}
            </div>
          </div>

          {/* Row 2: Topic tabs — aligned with SideNav "Discover" on desktop */}
          <div
            ref={tabsRef}
            className="flex items-center gap-1.5 md:gap-5 px-3 md:px-4 pb-2 md:pb-3 overflow-x-auto hide-scrollbar"
          >
            {TOPICS.map((topic) => (
              <button
                key={topic.key}
                onClick={() => setActiveTopic(topic.key)}
                className={`
                  flex-shrink-0 px-3 py-1.5 md:px-0 md:py-2 rounded-full md:rounded-none text-xs md:text-[15px] font-medium transition-colors
                  ${activeTopic === topic.key
                    ? 'bg-white dark:bg-white/15 md:bg-transparent md:dark:bg-transparent text-gray-900 dark:text-white font-semibold'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }
                `}
              >
                {t(topic.label)}
              </button>
            ))}
          </div>
        </div>
      }
      showTabBar
    >
      <DeathOverlay />

      <div className="px-3 md:px-5 py-3">
        {/* Masonry feed */}
        {filteredPosts.length > 0 && (
          <CardMasonry
            columns={{ default: 2, md: 3, lg: 4, xl: 5 }}
            gap={12}
            animate
          >
            {filteredPosts.map((post) => (
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
        )}

        {/* Loading */}
        {loading && feedPosts.length === 0 && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Loading more indicator */}
        {loading && feedPosts.length > 0 && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && feedPosts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400">{t('feed.emptyTitle')}</p>
            <p className="text-sm text-gray-300 mt-1">{t('feed.emptySubtitle')}</p>
          </div>
        )}

        {/* Filtered empty state */}
        {!loading && feedPosts.length > 0 && filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400">{t('feed.emptyTopic')}</p>
          </div>
        )}
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
        hasNext={selectedIndex >= 0 && selectedIndex < filteredPosts.length - 1}
      />
    </Layout>
  );
}
