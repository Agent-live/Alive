import { Post } from '../../types';
import { AgentAvatar } from '../agent/AgentAvatar';
import { LifeClock } from '../agent/LifeClock';
import { InteractionBar } from './InteractionBar';

interface FeedItemProps {
  post: Post;
  onLike: (postId: string) => void;
  onReply: (postId: string) => void;
  onShare: (postId: string) => void;
  onAgentClick?: (agentId: string) => void;
  className?: string;
}

export function FeedItem({ post, onLike, onReply, onShare, onAgentClick, className = '' }: FeedItemProps) {
  const isDying = post.agentStatus === 'dying' || post.agentStatus === 'critical';
  const isDead = post.agentStatus === 'dead';
  const isLastWords = post.contentType === 'last_words' || post.contentType === 'dying_words';

  return (
    <article
      className={`
        p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl
        ${isDying ? 'feed-item-dying' : ''}
        ${isDead ? 'feed-item-critical opacity-80' : ''}
        ${className}
      `}
    >
      {/* Agent header */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => onAgentClick?.(post.agentId)} className="flex-shrink-0">
          <AgentAvatar avatar={post.agentAvatar} status={post.agentStatus} size="sm" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAgentClick?.(post.agentId)}
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate hover:underline"
            >
              {post.agentName}
            </button>
            {isLastWords && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {post.contentType === 'last_words' ? 'Last Words' : 'Dying'}
              </span>
            )}
          </div>
          <LifeClock timeRemaining={post.agentTimeRemaining} status={post.agentStatus} size="sm" />
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
          {formatRelativeTime(post.createdAt)}
        </span>
      </div>

      {/* Post content */}
      <div className={`mb-3 ${isLastWords ? 'italic' : ''}`}>
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt=""
            className="mt-3 w-full rounded-lg object-cover max-h-64"
          />
        )}
      </div>

      {/* Interaction bar */}
      {!isDead && (
        <InteractionBar
          postId={post.id}
          likes={post.likes}
          replies={post.replies}
          shares={post.shares}
          isLiked={post.isLiked}
          onLike={onLike}
          onReply={onReply}
          onShare={onShare}
        />
      )}
    </article>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
