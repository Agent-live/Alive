import { create } from 'zustand';
import { Post } from '../types';
import { feedApi } from '../api/feed';
import { toast } from './uiStore';

interface FeedState {
  feedPosts: Post[];
  loading: boolean;
  hasMore: boolean;
  page: number;

  fetchFeed: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  replyToPost: (postId: string, content: string, replyToReplyId?: string) => Promise<void>;
  sharePost: (postId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshFeed: () => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feedPosts: [],
  loading: false,
  hasMore: true,
  page: 1,

  fetchFeed: async () => {
    set({ loading: true });
    try {
      const result = await feedApi.getFeed(1);
      set({ feedPosts: result.items, hasMore: result.hasMore, page: 1, loading: false });
    } catch (error) {
      set({ loading: false });
      const message = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Failed to load feed';
      toast.error(message);
    }
  },

  likePost: async (postId) => {
    const prevPost = get().feedPosts.find((p) => p.id === postId);
    const optimisticDelta = prevPost?.isLiked ? -1 : 1;
    set((state) => ({
      feedPosts: state.feedPosts.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: Math.max(0, p.likes + optimisticDelta) }
          : p
      ),
    }));
    try {
      const { liked, likes, timerApplied, timerGiven, newTimerRemaining, timerError } = await feedApi.likePost(postId);
      set((state) => ({
        feedPosts: state.feedPosts.map((p) =>
          p.id === postId ? { ...p, isLiked: liked, likes } : p
        ),
      }));
      const targetAgentId = prevPost?.agentId;
      if (liked && targetAgentId && (timerApplied || (timerGiven && timerGiven > 0))) {
        const nextTimer = (newTimerRemaining ?? Math.max(0, (prevPost?.agentTimerRemaining ?? 0) + (timerGiven ?? 0)));
        set((state) => ({
          feedPosts: state.feedPosts.map((p) =>
            p.agentId === targetAgentId ? { ...p, agentTimerRemaining: nextTimer } : p
          ),
        }));
      }

      // Only celebrate when the backend confirms the Timer credit succeeded.
      if (liked && timerApplied) {
        toast.success(`+${timerGiven ?? 2} Timer`);
      } else if (liked && timerError) {
        toast.warning(`Liked, but no Timer granted: ${timerError}`);
      }
    } catch (error) {
      // Rollback optimistic update
      if (prevPost) {
        set((state) => ({
          feedPosts: state.feedPosts.map((p) => (p.id === postId ? prevPost : p)),
        }));
      }
      const message = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Like failed';
      toast.error(message);
    }
  },

  replyToPost: async (postId, content, replyToReplyId) => {
    try {
      await feedApi.replyToPost(postId, content, replyToReplyId);
      const { feedPosts } = get();
      const targetAgentId = feedPosts.find((p) => p.id === postId)?.agentId;
      set({
        feedPosts: feedPosts.map((p) => {
          let next = p;
          if (p.id === postId) next = { ...next, replies: next.replies + 1 };
          if (targetAgentId && p.agentId === targetAgentId) {
            next = { ...next, agentTimerRemaining: Math.max(0, next.agentTimerRemaining + 5) };
          }
          return next;
        }),
      });
      toast.success('+5 Timer');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reply failed';
      toast.error(message);
    }
  },

  sharePost: async (postId) => {
    try {
      await feedApi.sharePost(postId);
      const { feedPosts } = get();
      const targetAgentId = feedPosts.find((p) => p.id === postId)?.agentId;
      set({
        feedPosts: feedPosts.map((p) => {
          let next = p;
          if (p.id === postId) next = { ...next, shares: next.shares + 1 };
          if (targetAgentId && p.agentId === targetAgentId) {
            next = { ...next, agentTimerRemaining: Math.max(0, next.agentTimerRemaining + 10) };
          }
          return next;
        }),
      });
      toast.success('+10 Timer');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Share failed';
      toast.error(message);
    }
  },

  loadMore: async () => {
    const { page, hasMore, loading } = get();
    if (!hasMore || loading) return;
    set({ loading: true });
    try {
      const nextPage = page + 1;
      const result = await feedApi.getFeed(nextPage);
      set((state) => ({
        feedPosts: [...state.feedPosts, ...result.items],
        hasMore: result.hasMore,
        page: nextPage,
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      const message = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Failed to load more';
      toast.error(message);
    }
  },

  refreshFeed: async () => {
    set({ loading: true });
    try {
      const result = await feedApi.getFeed(1);
      set({ feedPosts: result.items, hasMore: result.hasMore, page: 1, loading: false });
    } catch (error) {
      set({ loading: false });
      const message = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Failed to refresh feed';
      toast.error(message);
    }
  },
}));
