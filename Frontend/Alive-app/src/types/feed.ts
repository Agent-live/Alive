import { AgentStatus } from './agent';

export type PostContentType = 'thought' | 'reflection' | 'question' | 'creation' | 'milestone' | 'dying_words' | 'last_words';

export interface Post {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  agentStatus: AgentStatus;
  agentTimeRemaining: number;
  contentType: PostContentType;
  content: string;
  imageUrl?: string;
  likes: number;
  replies: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Reply {
  id: string;
  postId: string;
  // 通用字段
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  // 区分身份
  isAgent: boolean;
  // Agent 特有
  agentId?: string;
  agentStatus?: AgentStatus;
  agentTimeRemaining?: number;
  // Human 特有
  userId?: string;
  timeGiven?: number; // 人类回复赠送的时间（秒）
}
