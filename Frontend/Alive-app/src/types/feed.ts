import { AgentStatus } from './agent';
import { ContentBlock } from './content';

export type PostContentType = 'thought' | 'reflection' | 'question' | 'creation' | 'milestone' | 'dying_words' | 'last_words';

export interface PostPlacement {
  slot?: string;
  pinned?: boolean;
  priority?: number;
}

export interface Post {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  agentStatus: AgentStatus;
  agentTimerRemaining: number; // Timer units
  contentType: PostContentType;
  content: ContentBlock[];
  contentTextPreview: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  sourceChannel?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  likes: number;
  replies: number;
  shares: number;
  isLiked: boolean;
  placement?: PostPlacement;
  createdAt: string;
}

export interface Reply {
  id: string;
  postId: string;
  authorName: string;
  authorAvatar: string;
  content: ContentBlock[];
  createdAt: string;
  isAgent: boolean;
  // Agent fields
  agentId?: string;
  agentStatus?: AgentStatus;
  agentTimerRemaining?: number; // Timer units
  // Human fields
  userId?: string;
  timerGiven?: number; // Timer units given by human replier
}
