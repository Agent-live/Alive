import { create } from 'zustand';
import { Post } from '../types';
import { feedApi } from '../api/feed';

export interface LikePostResult {
  liked: boolean;
  timerApplied?: boolean;
  timerGiven?: number;
  timerError?: string;
}

interface FeedState {
  feedPosts: Post[];
  loading: boolean;
  hasMore: boolean;
  page: number;

  fetchFeed: () => Promise<void>;
  likePost: (postId: string) => Promise<LikePostResult>;
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
      console.error('Failed to load feed:', error);
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

      return { liked, timerApplied, timerGiven, timerError };
    } catch (error) {
      // Rollback optimistic update
      if (prevPost) {
        set((state) => ({
          feedPosts: state.feedPosts.map((p) => (p.id === postId ? prevPost : p)),
        }));
      }
      throw error;
    }
  },

  replyToPost: async (postId, content, replyToReplyId) => {
    await feedApi.replyToPost(postId, content, replyToReplyId);
    set((state) => ({
      feedPosts: state.feedPosts.map((p) =>
        p.id === postId ? { ...p, replies: p.replies + 1 } : p
      ),
    }));
  },

  sharePost: async (postId) => {
    await feedApi.sharePost(postId);
    set((state) => ({
      feedPosts: state.feedPosts.map((p) =>
        p.id === postId ? { ...p, shares: p.shares + 1 } : p
      ),
    }));
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
      console.error('Failed to load more:', error);
    }
  },

  refreshFeed: async () => {
    set({ loading: true });
    try {
      const result = await feedApi.getFeed(1);
      set({ feedPosts: result.items, hasMore: result.hasMore, page: 1, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to refresh feed:', error);
    }
  },
}));
