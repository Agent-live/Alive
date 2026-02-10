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
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timeGiven: number; // seconds given with this reply
  createdAt: string;
}
