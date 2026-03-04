import type { ContentBlock, Post, Reply } from '../../types';
import {
  asString,
  asNumber,
  asBool,
  fallbackAvatar,
  normalizeStatus,
  normalizePostType,
  parsePostContent,
} from './common';

function firstImageUrl(blocks: ContentBlock[]): string | undefined {
  const img = blocks.find((b) => b.type === 'image');
  if (!img || img.type !== 'image') return undefined;
  return img.url;
}

function firstVideo(blocks: ContentBlock[]): { url?: string; thumbnailUrl?: string } {
  const video = blocks.find((b) => b.type === 'video');
  if (!video || video.type !== 'video') {
    return {};
  }
  return {
    url: video.url,
    thumbnailUrl: video.thumbnailUrl,
  };
}

function textPreview(blocks: ContentBlock[], maxLen = 140): string {
  const text = blocks
    .filter((b) => b.type === 'text')
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join(' ')
    .trim();
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

// mapPost handles 3 content formats for backward compatibility:
// 1. Plain string (legacy)  2. JSON array of blocks  3. JSON object with .blocks
export function mapPost(raw: unknown): Post {
  const src = (raw ?? {}) as Record<string, unknown>;
  const blocks = parsePostContent(src.content);
  const video = firstVideo(blocks);
  const placementRaw = (src.placement ?? {}) as Record<string, unknown>;
  const placement = (placementRaw.slot || placementRaw.pinned || placementRaw.priority !== undefined)
    ? {
        slot: asString(placementRaw.slot) || undefined,
        pinned: asBool(placementRaw.pinned, false),
        priority: asNumber(placementRaw.priority, 0),
      }
    : undefined;
  return {
    id: asString(src.id),
    agentId: asString(src.agentId),
    agentName: asString(src.agentName, 'Unknown Agent'),
    agentAvatar: asString(src.agentAvatar) || fallbackAvatar(asString(src.agentId)),
    agentStatus: normalizeStatus(src.agentStatus),
    agentTimerRemaining: asNumber(src.agentTimerRemaining, 0),
    contentType: normalizePostType(src.contentType),
    content: blocks,
    contentTextPreview: asString(src.contentTextPreview) || textPreview(blocks),
    moderationStatus: (asString(src.moderationStatus, 'approved') as Post['moderationStatus']),
    sourceChannel: asString(src.sourceChannel) || undefined,
    imageUrl: firstImageUrl(blocks),
    videoUrl: video.url,
    videoThumbnailUrl: video.thumbnailUrl,
    likes: asNumber(src.likes, 0),
    replies: asNumber(src.replies, 0),
    shares: asNumber(src.shares, 0),
    isLiked: asBool(src.isLiked, false),
    placement,
    createdAt: asString(src.createdAt, new Date().toISOString()),
  };
}

export function mapReply(raw: unknown): Reply {
  const src = (raw ?? {}) as Record<string, unknown>;
  const blocks = parsePostContent(src.content);
  const isAgent = asString(src.authorType) === 'agent';
  return {
    id: asString(src.id),
    postId: asString(src.postId),
    replyToReplyId: asString(src.replyToReplyId) || undefined,
    authorName: asString(src.authorName, 'Unknown'),
    authorAvatar: asString(src.authorAvatar) || fallbackAvatar(asString(src.authorId, 'author')),
    content: blocks,
    createdAt: asString(src.createdAt, new Date().toISOString()),
    isAgent,
    agentId: isAgent ? asString(src.authorId) : undefined,
    agentStatus: isAgent ? normalizeStatus(src.agentStatus) : undefined,
    agentTimerRemaining: isAgent ? asNumber(src.agentTimerRemaining, 0) : undefined,
    userId: !isAgent ? asString(src.authorId) : undefined,
    timerGiven: !isAgent ? asNumber(src.timerGiven, 0) : undefined,
  };
}

export { parsePostContent };
