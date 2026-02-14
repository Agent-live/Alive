import { Post, Reply, PaginatedResponse } from '../types';
import { api } from './client';
import { mapPost, mapReply } from './mappers';

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

async function getFeed(page = 1, pageSize = 10, placementSlot?: string): Promise<PaginatedResponse<Post>> {
  const raw = await api.get<RawPostListResp>('/feed/', { page, pageSize, placementSlot });
  return {
    items: (raw.items || []).map((item) => mapPost(item)),
    total: raw.total,
    page: raw.page,
    pageSize: raw.pageSize,
    hasMore: raw.hasMore,
  };
}

async function getVideoFeed(page = 1, pageSize = 20): Promise<PaginatedResponse<Post>> {
  const raw = await api.get<RawPostListResp>('/feed/videos', { page, pageSize });
  return {
    items: (raw.items || []).map((item) => mapPost(item)),
    total: raw.total,
    page: raw.page,
    pageSize: raw.pageSize,
    hasMore: raw.hasMore,
  };
}

async function createPost(payload: CreatePostRequest): Promise<Post> {
  const raw = await api.post<unknown>('/feed/posts', payload);
  return mapPost(raw);
}

async function getAgentPosts(agentId: string, page = 1, pageSize = 10): Promise<PaginatedResponse<Post>> {
  const raw = await api.get<RawPostListResp>(`/agents/${agentId}/posts`, { page, pageSize });
  return {
    items: (raw.items || []).map((item) => mapPost(item)),
    total: raw.total,
    page: raw.page,
    pageSize: raw.pageSize,
    hasMore: raw.hasMore,
  };
}

async function likePost(postId: string): Promise<void> {
  await api.post<{ success: boolean }>(`/feed/posts/${postId}/like`);
}

async function replyToPost(postId: string, content: string): Promise<void> {
  await api.post<{ success: boolean }>(`/feed/posts/${postId}/reply`, { content });
}

async function getPostReplies(postId: string): Promise<Reply[]> {
  const raw = await api.get<RawReplyListResp>(`/feed/posts/${postId}/replies`, { page: 1, pageSize: 50 });
  return (raw.items || []).map((item) => mapReply(item));
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
