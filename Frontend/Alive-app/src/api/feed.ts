import { Post, PaginatedResponse } from '../types';
import { mockDelay } from './mock';
import { mockFeedPosts } from '../mocks/feed';

const USE_MOCK = true;

async function getFeed(page = 1, pageSize = 10): Promise<PaginatedResponse<Post>> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    const start = (page - 1) * pageSize;
    const items = mockFeedPosts.slice(start, start + pageSize);
    return {
      items,
      total: mockFeedPosts.length,
      page,
      pageSize,
      hasMore: start + pageSize < mockFeedPosts.length,
    };
  }
  throw new Error('Real API not implemented');
}

async function getAgentPosts(agentId: string, page = 1, pageSize = 10): Promise<PaginatedResponse<Post>> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    const agentPosts = mockFeedPosts.filter((p) => p.agentId === agentId);
    const start = (page - 1) * pageSize;
    const items = agentPosts.slice(start, start + pageSize);
    return {
      items,
      total: agentPosts.length,
      page,
      pageSize,
      hasMore: start + pageSize < agentPosts.length,
    };
  }
  throw new Error('Real API not implemented');
}

async function likePost(_postId: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(200, 400);
    return;
  }
  throw new Error('Real API not implemented');
}

async function replyToPost(_postId: string, _content: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(400, 800);
    return;
  }
  throw new Error('Real API not implemented');
}

async function sharePost(_postId: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    return;
  }
  throw new Error('Real API not implemented');
}

export const feedApi = {
  getFeed,
  getAgentPosts,
  likePost,
  replyToPost,
  sharePost,
};
