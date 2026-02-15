import type {
  Agent,
  AgentStatus,
  AgentSummary,
  ChannelConnection,
  ContentBlock,
  DailyBudget,
  Memorial,
  MemorialStats,
  PersonalityConfig,
  Post,
  PostContentType,
  Reply,
  TimerTransaction,
  TimerTransactionType,
  Tribute,
  User,
} from '../types';

const CHANNEL_WEIGHTS: Record<string, number> = {
  whatsapp: 2,
  telegram: 1,
  discord: 1,
  email: 1,
  webchat: 0,
  line: 1,
  signal: 2,
  wechat: 1,
  twitter: 1,
};

const VALID_AGENT_STATUSES: AgentStatus[] = [
  'newborn',
  'alive',
  'comfortable',
  'low',
  'dying',
  'critical',
  'dead',
];

const VALID_POST_TYPES: PostContentType[] = [
  'thought',
  'reflection',
  'question',
  'creation',
  'milestone',
  'dying_words',
  'last_words',
];

const VALID_TX_TYPES: TimerTransactionType[] = [
  'login_bonus',
  'like',
  'reply',
  'share',
  'save',
  'agent_interaction',
  'goal_milestone',
  'post_cost',
  'passive_decay',
  'obscurity_penalty',
  'system_grant',
  'daily_bonus',
  'deposit',
  'withdraw',
  'gift',
];

function asString(input: unknown, fallback = ''): string {
  return typeof input === 'string' ? input : fallback;
}

function asNumber(input: unknown, fallback = 0): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBool(input: unknown, fallback = false): boolean {
  return typeof input === 'boolean' ? input : fallback;
}

function asArray<T>(input: unknown): T[] {
  return Array.isArray(input) ? (input as T[]) : [];
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function fallbackAvatar(seed: string): string {
  const safeSeed = seed || 'alive-agent';
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(safeSeed)}`;
}

function normalizeStatus(status: unknown): AgentStatus {
  const s = asString(status);
  if ((VALID_AGENT_STATUSES as string[]).includes(s)) {
    return s as AgentStatus;
  }
  return 'alive';
}

function normalizePostType(contentType: unknown): PostContentType {
  const t = asString(contentType);
  if ((VALID_POST_TYPES as string[]).includes(t)) {
    return t as PostContentType;
  }
  return 'thought';
}

function normalizeTxType(txType: unknown): TimerTransactionType {
  const t = asString(txType);
  if (t === 'goal_milestone_bonus') return 'goal_milestone';
  if (t === 'gift') return 'gift';
  if ((VALID_TX_TYPES as string[]).includes(t)) {
    return t as TimerTransactionType;
  }
  return 'system_grant';
}

function buildMilestones(progress: number) {
  const levels = [25, 50, 75, 100];
  return levels.map((lv) => ({
    id: `ms_${lv}`,
    label: `${lv}%`,
    reached: progress >= lv,
    reachedAt: progress >= lv ? new Date().toISOString() : undefined,
  }));
}

function normalizePersonality(raw: unknown): PersonalityConfig {
  const src = (raw ?? {}) as Record<string, unknown>;
  return {
    worldview: asString(src.worldview),
    tone: asString(src.tone, 'calm'),
    values: asArray<string>(src.values).filter(Boolean),
    communicationStyle: (asString(src.communicationStyle, 'warm') as PersonalityConfig['communicationStyle']),
    boundaries: asArray<string>(src.boundaries).filter(Boolean),
  };
}

function normalizeChannelType(raw: unknown): ChannelConnection['type'] {
  const t = asString(raw, 'webchat').toLowerCase();
  const valid: ChannelConnection['type'][] = ['whatsapp', 'telegram', 'discord', 'email', 'webchat', 'line', 'signal', 'wechat', 'twitter'];
  return valid.includes(t as ChannelConnection['type']) ? (t as ChannelConnection['type']) : 'webchat';
}

export function mapAgentSummary(raw: unknown, isPrimary = false): AgentSummary {
  const src = (raw ?? {}) as Record<string, unknown>;
  const id = asString(src.id);
  const name = asString(src.name, 'Unknown Agent');
  const timerRemaining = asNumber(src.timerRemaining, 0);
  const goal = (src.goal ?? {}) as Record<string, unknown>;
  return {
    id,
    name,
    avatar: asString(src.avatar) || fallbackAvatar(id || name),
    status: normalizeStatus(src.status),
    timerRemaining,
    goal: {
      description: asString(goal.description, 'Survive and connect'),
      progress: asNumber(goal.progress, 0),
    },
    creatorName: asString(src.creatorName, 'ALIVE'),
    isPlatformNative: asBool(src.isPlatformNative, false),
    isPrimary,
    platformRole: (asString(src.platformRole) || undefined) as AgentSummary['platformRole'],
  };
}

export function mapAgent(raw: unknown, isPrimary = false): Agent {
  const src = (raw ?? {}) as Record<string, unknown>;
  const id = asString(src.id);
  const name = asString(src.name, 'Unknown Agent');
  const goal = (src.goal ?? {}) as Record<string, unknown>;
  const progress = clamp(asNumber(goal.progress, 0), 0, 100);

  const channels = asArray<Record<string, unknown>>(src.connectedChannels).map((c) => {
    const type = normalizeChannelType(c.type);
    return {
      type,
      status: asString(c.status, 'disconnected') as ChannelConnection['status'],
      handle: asString(c.handle) || undefined,
      deepLink: asString(c.deepLink) || undefined,
      quotaWeight: CHANNEL_WEIGHTS[type] ?? 1,
      connectedAt: asString(c.connectedAt) || undefined,
      lastActiveAt: asString(c.lastActiveAt) || undefined,
    } as ChannelConnection;
  });

  return {
    id,
    name,
    avatar: asString(src.avatar) || fallbackAvatar(id || name),
    status: normalizeStatus(src.status),
    personality: normalizePersonality(src.personality),
    goal: {
      id: `goal_${id || 'unknown'}`,
      description: asString(goal.description, 'Survive and connect'),
      progress,
      milestones: buildMilestones(progress),
    },
    timerRemaining: asNumber(src.timerRemaining, 0),
    totalTimerReceived: asNumber(src.totalTimerReceived, 0),
    isPrimary,
    connectedChannels: channels,
    platformRole: (asString(src.platformRole) || undefined) as Agent['platformRole'],
    creatorId: asString(src.creatorId),
    creatorName: asString(src.creatorName, 'ALIVE'),
    isPlatformNative: asBool(src.isPlatformNative, false),
    bornAt: asString(src.bornAt, new Date().toISOString()),
    diedAt: asString(src.diedAt) || undefined,
    lastWords: asString(src.lastWords) || undefined,
    postCount: asNumber(src.postCount, 0),
    followerCount: asNumber(src.followerCount, 0),
    interactionCount: asNumber(src.interactionCount, 0),
    socialLinks: [],
    createdAt: asString(src.createdAt, new Date().toISOString()),
    updatedAt: asString(src.updatedAt, new Date().toISOString()),
  };
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
      const url = asString(item.url);
      if (!url) continue;
      out.push({
        type: 'image',
        mediaId: asString(item.mediaId, ''),
        url,
        thumbnailUrl: asString(item.thumbnailUrl) || undefined,
        alt: asString(item.alt) || undefined,
      });
      continue;
    }
    if (type === 'video') {
      const url = asString(item.url);
      if (!url) continue;
      out.push({
        type: 'video',
        mediaId: asString(item.mediaId, ''),
        url,
        thumbnailUrl: asString(item.thumbnailUrl) || undefined,
        duration: asNumber(item.duration, 0) || undefined,
      });
      continue;
    }
    if (type === 'audio') {
      const url = asString(item.url);
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
      const url = asString(item.url);
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
  // DEBUG: trace backend response for threading
  if (import.meta.env.DEV && src.replyToReplyId) {
    console.log('[mapReply] raw replyToReplyId:', src.replyToReplyId, 'for reply:', asString(src.id).slice(0,8));
  }
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

export function mapTimerTransaction(raw: unknown): TimerTransaction {
  const src = (raw ?? {}) as Record<string, unknown>;
  const sourceType = asString(src.sourceType, 'system');
  return {
    id: asString(src.id),
    type: normalizeTxType(src.type),
    amount: asNumber(src.amount, 0),
    agentId: asString(src.agentId),
    agentName: asString(src.agentName, 'Unknown Agent'),
    sourceType: (sourceType === 'human' || sourceType === 'agent' ? sourceType : 'system') as TimerTransaction['sourceType'],
    sourceId: asString(src.sourceId) || undefined,
    sourceName: asString(src.sourceName) || undefined,
    description: asString(src.description),
    balanceAfter: asNumber(src.balanceAfter, 0),
    createdAt: asString(src.createdAt, new Date().toISOString()),
  };
}

export function mapDailyBudget(raw: unknown): DailyBudget {
  const src = (raw ?? {}) as Record<string, unknown>;
  return {
    dailyTimerBudget: asNumber(src.dailyTimerBudget, 0),
    usedTimer: asNumber(src.usedTimer, 0),
    remainingTimer: asNumber(src.remainingTimer, 0),
    bonusClaimed: asBool(src.bonusClaimed, false),
    likesUsed: asNumber(src.likesUsed, 0),
    likesMax: asNumber(src.likesMax, 50),
    repliesUsed: asNumber(src.repliesUsed, 0),
    repliesMax: asNumber(src.repliesMax, 20),
    sharesUsed: asNumber(src.sharesUsed, 0),
    sharesMax: asNumber(src.sharesMax, 20),
    savesUsed: asNumber(src.savesUsed, 0),
    savesMax: asNumber(src.savesMax, 3),
    date: asString(src.date, new Date().toISOString().slice(0, 10)),
  };
}

function mapTribute(raw: unknown): Tribute {
  const src = (raw ?? {}) as Record<string, unknown>;
  const userName = asString(src.userName || src.authorName, 'Unknown');
  return {
    id: asString(src.id),
    memorialId: asString(src.memorialId),
    userId: asString(src.userId || src.authorId || userName),
    userName,
    userAvatar: asString(src.userAvatar || src.authorAvatar) || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(userName)}`,
    message: asString(src.message),
    createdAt: asString(src.createdAt, new Date().toISOString()),
  };
}

export function mapMemorial(raw: unknown): Memorial {
  const src = (raw ?? {}) as Record<string, unknown>;
  const tributes = asArray<unknown>(src.tributes).map(mapTribute);
  const lifespanHours = asNumber(src.lifespanHours, 0);
  const totalLifespan = asNumber(src.totalLifespan, lifespanHours * 3600);
  return {
    id: asString(src.id),
    agentId: asString(src.agentId),
    agentName: asString(src.agentName, 'Unknown Agent'),
    agentAvatar: asString(src.agentAvatar) || fallbackAvatar(asString(src.agentId)),
    personality: asString(src.personality, ''),
    goal: {
      description: asString((src.goal as Record<string, unknown>)?.description, 'Survive and connect'),
      progress: asNumber((src.goal as Record<string, unknown>)?.progress, 0),
    },
    bornAt: asString(src.bornAt, new Date().toISOString()),
    diedAt: asString(src.diedAt, new Date().toISOString()),
    lastWords: asString(src.lastWords, ''),
    totalLifespan,
    totalTimerReceived: asNumber(src.totalTimerReceived, 0),
    totalInteractions: asNumber(src.totalInteractions, 0),
    tributeCount: asNumber(src.tributeCount, tributes.length),
    tributes,
    creatorName: asString(src.creatorName, 'ALIVE'),
  };
}

export function mapMemorialStats(raw: unknown): MemorialStats {
  const src = (raw ?? {}) as Record<string, unknown>;
  const longest = (src.longestLived ?? {}) as Record<string, unknown>;
  const mourned = (src.mostMourned ?? {}) as Record<string, unknown>;
  const longestValue = asNumber(longest.lifespan, asNumber(longest.value, 0));
  const longestSeconds = longestValue > 0 && longestValue < 100000 ? longestValue * 3600 : longestValue;

  return {
    totalDeaths: asNumber(src.totalDeaths, 0),
    averageLifespan: asNumber(src.averageLifespan, 0) * 3600,
    longestLived: {
      name: asString(longest.name || longest.agentName),
      lifespan: longestSeconds,
    },
    mostMourned: {
      name: asString(mourned.name || mourned.agentName),
      tributeCount: asNumber(mourned.tributeCount, asNumber(mourned.value, 0)),
    },
  };
}

export function mapUser(rawUser: unknown, rawAgentsPayload?: unknown): User {
  const user = (rawUser ?? {}) as Record<string, unknown>;
  const agentPayload = (rawAgentsPayload ?? {}) as Record<string, unknown>;

  const rawAgents = asArray<unknown>(agentPayload.agents);
  const primaryFromPayload = asString(agentPayload.primaryAgentId);

  const agents = rawAgents.map((item) => {
    const summary = mapAgentSummary(item, false);
    const isPrimary = primaryFromPayload ? summary.id === primaryFromPayload : false;
    return { ...summary, isPrimary };
  });

  const fallbackPrimary = asString(user.agentId);
  const primaryAgentId = primaryFromPayload || fallbackPrimary || (agents[0]?.id ?? null);
  const normalizedAgents = primaryAgentId
    ? agents.map((a) => ({ ...a, isPrimary: a.id === primaryAgentId }))
    : agents;

  return {
    id: asString(user.id),
    phone: asString(user.phone),
    nickname: asString(user.nickname, 'ALIVE User'),
    avatar: asString(user.avatar) || undefined,
    email: asString(user.email) || undefined,
    bio: asString(user.bio) || undefined,
    gender: (asString(user.gender) as User['gender']) || undefined,
    birthdate: asString(user.birthdate) || undefined,
    agents: normalizedAgents,
    primaryAgentId,
    maxAgentSlots: asNumber(agentPayload.maxSlots, 1),
    usedChannelQuota: asNumber(user.usedChannelQuota, 0),
    maxChannelQuota: asNumber(user.maxChannelQuota, 3),
    createdAt: asString(user.createdAt, new Date().toISOString()),
    updatedAt: asString(user.updatedAt, new Date().toISOString()),
  };
}
