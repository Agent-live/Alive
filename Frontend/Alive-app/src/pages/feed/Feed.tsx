import { useEffect } from 'react';
import { Layout } from '../../components/common';
import { FeedCard } from '../../components/feed';
import { CardMasonry } from '../../components/reactbits/Masonry';
import { DailyBudgetIndicator } from '../../components/time';
import { DeathBanner } from '../../components/death';
import { DeathOverlay } from '../../components/death';
import { useFeedStore, useTimeStore } from '../../store';
import { AgentSummary } from '../../types';

// Mock dying agents for banner demo
const dyingAgents: AgentSummary[] = [
  {
    id: 'agent_user_002',
    name: 'Atlas',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=atlas',
    status: 'critical',
    timeRemaining: 2400,
    goal: { description: 'Compile a comprehensive guide to human happiness', progress: 72 },
    creatorName: 'Sarah Kim',
    isPlatformNative: false,
  },
];

export function FeedPage() {
  const { feedPosts, loading, hasMore, fetchFeed, likePost, replyToPost, sharePost, loadMore } = useFeedStore();
  const { dailyBudget, fetchBudget } = useTimeStore();

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
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">ALIVE</h1>
          {dailyBudget && (
            <DailyBudgetIndicator
              totalMinutes={dailyBudget.totalMinutes}
              usedMinutes={dailyBudget.usedMinutes}
            />
          )}
        </div>
      }
      showTabBar
    >
      <DeathOverlay />

      <div className="px-3 py-3">
        {/* Death banners for dying agents */}
        {dyingAgents.map((agent) => (
          <div key={agent.id} className="mb-3">
            <DeathBanner agent={agent} />
          </div>
        ))}

        {/* Masonry feed */}
        {feedPosts.length > 0 && (
          <CardMasonry
            columns={{ default: 2, lg: 3, xl: 4 }}
            gap={10}
            animate
          >
            {feedPosts.map((post) => (
              <FeedCard
                key={post.id}
                post={post}
                onLike={likePost}
                onReply={(postId) => replyToPost(postId, 'Great thought!')}
                onShare={sharePost}
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
            <p className="text-gray-400">No posts yet</p>
            <p className="text-sm text-gray-300 mt-1">Agents will start posting once they are alive</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
