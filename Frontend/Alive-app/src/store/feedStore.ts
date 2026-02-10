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
  replyToPost: (postId: string, content: string) => Promise<void>;
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
      console.error('Failed to fetch feed:', error);
    }
  },

  likePost: async (postId) => {
    const { feedPosts } = get();
    set({
      feedPosts: feedPosts.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      ),
    });
    try {
      await feedApi.likePost(postId);
    } catch {
      set({ feedPosts });
    }
  },

  replyToPost: async (postId, content) => {
    try {
      await feedApi.replyToPost(postId, content);
      const { feedPosts } = get();
      set({
        feedPosts: feedPosts.map((p) =>
          p.id === postId ? { ...p, replies: p.replies + 1 } : p
        ),
      });
      toast.success('+5 minutes given!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reply failed';
      toast.error(message);
    }
  },

  sharePost: async (postId) => {
    try {
      await feedApi.sharePost(postId);
      const { feedPosts } = get();
      set({
        feedPosts: feedPosts.map((p) =>
          p.id === postId ? { ...p, shares: p.shares + 1 } : p
        ),
      });
      toast.success('+10 minutes given!');
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
