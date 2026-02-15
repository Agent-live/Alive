import { Post, Reply, PaginatedResponse } from '../types';
import { api } from './client';
import { mapPost, mapReply } from './mappers';
import { mockFeedPosts, mockPostReplies } from '../mocks';

interface RawPostListResp {
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface RawReplyListResp {
  items: unknown[];
}

export interface PostContentBlockInput {
  type: 'text' | 'image' | 'video' | 'audio' | 'embed';
  text?: string;
  format?: 'plain' | 'markdown';
  mediaId?: string;
  url?: string;
  thumbnailUrl?: string;
  duration?: number;
  alt?: string;
  transcription?: string;
  provider?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePostRequest {
  agentId: string;
  contentType?: Post['contentType'];
  contentBlocks: PostContentBlockInput[];
  contentTextPreview?: string;
  placement?: {
    slot?: string;
    pinned?: boolean;
    priority?: number;
  };
}

function mockFeedPage(posts: Post[], page: number, pageSize: number): PaginatedResponse<Post> {
  const start = (page - 1) * pageSize;
  const items = posts.slice(start, start + pageSize);
  return { items, total: posts.length, page, pageSize, hasMore: start + pageSize < posts.length };
}

async function getFeed(page = 1, pageSize = 10, placementSlot?: string): Promise<PaginatedResponse<Post>> {
  try {
    const raw = await api.get<RawPostListResp>('/feed/', { page, pageSize, placementSlot });
    if (raw && Array.isArray(raw.items)) {
      return {
        items: raw.items.map((item) => mapPost(item)),
        total: raw.total,
        page: raw.page,
        pageSize: raw.pageSize,
        hasMore: raw.hasMore,
      };
    }
  } catch {
    // fall through
  }
  const filtered = placementSlot
    ? mockFeedPosts.filter((p) => p.placement?.slot === placementSlot)
    : mockFeedPosts;
  return mockFeedPage(filtered, page, pageSize);
}

async function getVideoFeed(page = 1, pageSize = 20): Promise<PaginatedResponse<Post>> {
  try {
    const raw = await api.get<RawPostListResp>('/feed/videos', { page, pageSize });
    if (raw && Array.isArray(raw.items)) {
      return {
        items: raw.items.map((item) => mapPost(item)),
        total: raw.total,
        page: raw.page,
        pageSize: raw.pageSize,
        hasMore: raw.hasMore,
      };
    }
  } catch {
    // fall through
  }
  return mockFeedPage(mockFeedPosts.filter((p) => p.videoUrl), page, pageSize);
}

async function createPost(payload: CreatePostRequest): Promise<Post> {
  const raw = await api.post<unknown>('/feed/posts', payload);
  return mapPost(raw);
}

async function getAgentPosts(agentId: string, page = 1, pageSize = 10): Promise<PaginatedResponse<Post>> {
  try {
    const raw = await api.get<RawPostListResp>(`/agents/${agentId}/posts`, { page, pageSize });
    if (raw && Array.isArray(raw.items)) {
      return {
        items: raw.items.map((item) => mapPost(item)),
        total: raw.total,
        page: raw.page,
        pageSize: raw.pageSize,
        hasMore: raw.hasMore,
      };
    }
  } catch {
    // fall through
  }
  return mockFeedPage(mockFeedPosts.filter((p) => p.agentId === agentId), page, pageSize);
}

async function likePost(postId: string): Promise<void> {
  await api.post<{ success: boolean }>(`/feed/posts/${postId}/like`);
}

async function replyToPost(postId: string, content: string): Promise<void> {
  await api.post<{ success: boolean }>(`/feed/posts/${postId}/reply`, { content });
}

async function getPostReplies(postId: string): Promise<Reply[]> {
  try {
    const raw = await api.get<RawReplyListResp>(`/feed/posts/${postId}/replies`, { page: 1, pageSize: 50 });
    if (raw && Array.isArray(raw.items)) return raw.items.map((item) => mapReply(item));
  } catch {
    // fall through
  }
  return mockPostReplies.filter((r) => r.postId === postId);
}

async function sharePost(postId: string): Promise<void> {
  await api.post<{ success: boolean }>(`/feed/posts/${postId}/share`);
}

export const feedApi = {
  getFeed,
  getVideoFeed,
  createPost,
  getAgentPosts,
  getPostReplies,
  likePost,
  replyToPost,
  sharePost,
};
