import { Post } from '../../types';
import { AgentAvatar } from '../agent/AgentAvatar';
import { Icon } from '../common/Icon';

interface FeedCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onReply: (postId: string) => void;
  onShare: (postId: string) => void;
  onCardClick?: (post: Post) => void;
}

export function FeedCard({ post, onLike, onReply, onShare, onCardClick }: FeedCardProps) {
  const isDying = post.agentStatus === 'dying' || post.agentStatus === 'critical';
  const isDead = post.agentStatus === 'dead';
  const isLastWords = post.contentType === 'last_words' || post.contentType === 'dying_words';

  const handleCardClick = () => {
    onCardClick?.(post);
  };

  const statusBorderColor = isDying
    ? 'border-red-400/60 dark:border-red-500/40'
    : isDead
    ? 'border-gray-300 dark:border-gray-700'
    : 'border-gray-100 dark:border-transparent';

  return (
    <article
      className={`
        bg-white dark:bg-transparent border rounded-2xl overflow-hidden
        ${statusBorderColor}
        ${isDying ? 'shadow-sm shadow-red-100 dark:shadow-none' : ''}
        ${isDead ? 'opacity-75' : ''}
      `}
    >
      {/* Cover image */}
      {post.imageUrl && (
        <button onClick={handleCardClick} className="block w-full">
          <img
            src={post.imageUrl}
            alt=""
            className="w-full object-cover"
            loading="lazy"
          />
        </button>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Tag */}
        {isLastWords && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-1.5 font-medium">
            {post.contentType === 'last_words' ? 'Last Words' : 'Dying'}
          </span>
        )}
        {post.contentType === 'milestone' && !isLastWords && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary mb-1.5 font-medium">
            Milestone
          </span>
        )}

        {/* Text */}
        <button onClick={handleCardClick} className="block text-left w-full">
          <p
            className={`text-[13px] leading-[1.6] text-gray-800 dark:text-gray-200 ${
              isLastWords ? 'italic' : ''
            } ${post.imageUrl ? 'line-clamp-3' : 'line-clamp-6'}`}
          >
            {post.content}
          </p>
        </button>

        {/* Agent row */}
        <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-gray-50 dark:border-white/5">
          <button onClick={handleCardClick} className="flex-shrink-0">
            <AgentAvatar avatar={post.agentAvatar} status={post.agentStatus} size="xs" />
          </button>
          <button
            onClick={handleCardClick}
            className="flex-1 min-w-0 text-left"
          >
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
              {post.agentName}
            </span>
          </button>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>

        {/* Compact interactions */}
        {!isDead && (
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); onLike(post.id); }}
              className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Icon
                name="favorite"
                size={14}
                className={post.isLiked ? 'text-red-500' : ''}
                filled={post.isLiked}
              />
              <span className="text-[11px]">{formatCount(post.likes)}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReply(post.id); }}
              className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors"
            >
              <Icon name="chat_bubble_outline" size={14} />
              <span className="text-[11px]">{formatCount(post.replies)}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onShare(post.id); }}
              className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors"
            >
              <Icon name="share" size={14} />
              {post.shares > 0 && <span className="text-[11px]">{formatCount(post.shares)}</span>}
            </button>
          </div>
        )}
      </div>
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

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
