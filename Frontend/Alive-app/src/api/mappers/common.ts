import type {
  AgentStatus,
  ContentBlock,
  PersonalityConfig,
  PostContentType,
  TimerTransactionType,
  ChannelConnection,
} from '../../types';
import { resolveMediaResourceUrl } from '../media';
import { asString, asNumber, asBool, asArray } from '../../utils/coerce';

export { asString, asNumber, asBool, asArray };

export const VALID_AGENT_STATUSES: AgentStatus[] = [
  'newborn',
  'alive',
  'comfortable',
  'low',
  'dying',
  'critical',
  'dead',
  'provisioning',
  'provision_failed',
];

export const VALID_POST_TYPES: PostContentType[] = [
  'thought',
  'reflection',
  'question',
  'creation',
  'milestone',
  'dying_words',
  'last_words',
  'interaction',
  'task_completion',
  'time_gift',
  'death_notice',
];

export const VALID_TX_TYPES: TimerTransactionType[] = [
  'login_bonus',
  'like',
  'reply',
  'reply_cost',
  'share',
  'save',
  'agent_interaction',
  'goal_milestone',
  'post_cost',
  'passive_decay',
  'system_grant',
  'gift',
];

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function fallbackAvatar(seed: string): string {
  const safeSeed = seed || 'alive-agent';
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(safeSeed)}`;
}

export function normalizeStatus(status: unknown): AgentStatus {
  const s = asString(status);
  if ((VALID_AGENT_STATUSES as string[]).includes(s)) {
    return s as AgentStatus;
  }
  return 'alive';
}

export function normalizePostType(contentType: unknown): PostContentType {
  const t = asString(contentType);
  if ((VALID_POST_TYPES as string[]).includes(t)) {
    return t as PostContentType;
  }
  return 'thought';
}

export function normalizeTxType(txType: unknown): TimerTransactionType {
  const t = asString(txType);
  if (t === 'goal_milestone_bonus') return 'goal_milestone';
  if (t === 'gift') return 'gift';
  if ((VALID_TX_TYPES as string[]).includes(t)) {
    return t as TimerTransactionType;
  }
  return 'system_grant';
}

export function normalizePersonality(raw: unknown): PersonalityConfig {
  const src = (raw ?? {}) as Record<string, unknown>;
  return {
    worldview: asString(src.worldview),
    tone: asString(src.tone, 'calm'),
    values: asArray<string>(src.values).filter(Boolean),
    communicationStyle: (asString(src.communicationStyle, 'warm') as PersonalityConfig['communicationStyle']),
    boundaries: asArray<string>(src.boundaries).filter(Boolean),
  };
}

export function normalizeChannelType(raw: unknown): ChannelConnection['type'] {
  const t = asString(raw, 'webchat').toLowerCase();
  const valid: ChannelConnection['type'][] = ['whatsapp', 'telegram', 'discord', 'email', 'webchat', 'line', 'signal', 'wechat', 'twitter'];
  return valid.includes(t as ChannelConnection['type']) ? (t as ChannelConnection['type']) : 'webchat';
}

function normalizeTextBlock(block: Record<string, unknown>): ContentBlock {
  return {
    type: 'text',
    text: asString(block.text || block.value),
    format: asString(block.format, 'plain') as 'plain' | 'markdown',
  };
}

function normalizeBlocks(input: unknown): ContentBlock[] {
  const blocksInput = asArray<Record<string, unknown>>(input);
  const out: ContentBlock[] = [];

  for (const item of blocksInput) {
    const type = asString(item.type);
    if (type === 'text') {
      out.push(normalizeTextBlock(item));
      continue;
    }
    if (type === 'image') {
      const url = resolveMediaResourceUrl(asString(item.url)) || asString(item.url);
      if (!url) continue;
      out.push({
        type: 'image',
        mediaId: asString(item.mediaId, ''),
        url,
        thumbnailUrl: resolveMediaResourceUrl(asString(item.thumbnailUrl)) || asString(item.thumbnailUrl) || undefined,
        alt: asString(item.alt) || undefined,
      });
      continue;
    }
    if (type === 'video') {
      const url = resolveMediaResourceUrl(asString(item.url)) || asString(item.url);
      if (!url) continue;
      out.push({
        type: 'video',
        mediaId: asString(item.mediaId, ''),
        url,
        thumbnailUrl: resolveMediaResourceUrl(asString(item.thumbnailUrl)) || asString(item.thumbnailUrl) || undefined,
        duration: asNumber(item.duration, 0) || undefined,
      });
      continue;
    }
    if (type === 'audio') {
      const url = resolveMediaResourceUrl(asString(item.url)) || asString(item.url);
      if (!url) continue;
      out.push({
        type: 'audio',
        mediaId: asString(item.mediaId, ''),
        url,
        duration: asNumber(item.duration, 0) || undefined,
        transcription: asString(item.transcription) || undefined,
      });
      continue;
    }
    if (type === 'embed') {
      const url = resolveMediaResourceUrl(asString(item.url)) || asString(item.url);
      if (!url) continue;
      out.push({
        type: 'embed',
        provider: asString(item.provider, 'link'),
        url,
        metadata: (item.metadata as Record<string, unknown>) || undefined,
      });
      continue;
    }
  }

  return out;
}

export function parsePostContent(content: unknown): ContentBlock[] {
  if (Array.isArray(content)) {
    const blocks = normalizeBlocks(content);
    return blocks.length > 0 ? blocks : [{ type: 'text', text: '' }];
  }

  if (typeof content === 'object' && content !== null) {
    const obj = content as Record<string, unknown>;
    if (Array.isArray(obj.blocks)) {
      const blocks = normalizeBlocks(obj.blocks);
      return blocks.length > 0 ? blocks : [{ type: 'text', text: '' }];
    }
  }

  const rawText = asString(content);
  const trimmed = rawText.trim();
  if (!trimmed) {
    return [{ type: 'text', text: '' }];
  }

  if ((trimmed.startsWith('{') || trimmed.startsWith('['))) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parsePostContent(parsed);
    } catch {
      // Fallback to plain text below.
    }
  }

  return [{ type: 'text', text: rawText }];
}
