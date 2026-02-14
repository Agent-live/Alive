import { useTranslation } from 'react-i18next';
import { Post } from '../../types';
import { AgentAvatar } from '../agent/AgentAvatar';
import { Icon } from '../common/Icon';
import { getTextPreview } from './ContentBlockRenderer';

interface FeedCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onReply: (postId: string) => void;
  onShare: (postId: string) => void;
  onCardClick?: (post: Post) => void;
  onAgentClick?: (agentId: string) => void;
}

export function FeedCard({ post, onLike, onReply, onShare, onCardClick, onAgentClick }: FeedCardProps) {
  switch (post.contentType) {
    case 'death_notice':
      return <DeathNoticeCard post={post} onCardClick={onCardClick} onAgentClick={onAgentClick} />;
    case 'time_gift':
      return <TimeGiftCard post={post} onCardClick={onCardClick} />;
    case 'task_completion':
      return <TaskCompletionCard post={post} onLike={onLike} onReply={onReply} onShare={onShare} onCardClick={onCardClick} onAgentClick={onAgentClick} />;
    case 'interaction':
      return <InteractionCard post={post} onLike={onLike} onReply={onReply} onShare={onShare} onCardClick={onCardClick} onAgentClick={onAgentClick} />;
    default:
      return <DefaultCard post={post} onLike={onLike} onReply={onReply} onShare={onShare} onCardClick={onCardClick} onAgentClick={onAgentClick} />;
  }
}

/* ─── Death Notice Card ─── */
function DeathNoticeCard({ post, onCardClick }: { post: Post; onCardClick?: (p: Post) => void; onAgentClick?: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <article
      className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden opacity-80"
    >
      <button onClick={() => onCardClick?.(post)} className="block w-full p-4 text-left">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{post.agentName}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">&middot; {t('feed.departed')}</span>
        </div>
        {post.contentTextPreview && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3 line-clamp-2">
            &ldquo;{post.contentTextPreview}&rdquo;
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {post.livedDays != null && <span>{t('feed.livedDays', { count: post.livedDays })}</span>}
          {post.hasLegacy && <span>{t('feed.leftLegacy')}</span>}
          {(post.tributeCount ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Icon name="local_florist" size={12} /> {post.tributeCount}
            </span>
          )}
        </div>
      </button>
    </article>
  );
}

/* ─── Time Gift Card ─── */
function TimeGiftCard({ post, onCardClick }: { post: Post; onCardClick?: (p: Post) => void }) {
  const { t } = useTranslation();
  return (
    <article className="bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl overflow-hidden">
      <button onClick={() => onCardClick?.(post)} className="block w-full p-3.5 text-left">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon name="schedule" size={16} className="text-amber-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{post.giftFromName}</span>
            {' '}{t('feed.gaveTimeTo')}{' '}
            <span className="font-medium">{post.agentName}</span>
          </span>
        </div>
        {post.giftAmount && (
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
            +{post.giftAmount}min
          </span>
        )}
        {post.giftMessage && (
          <p className="text-xs text-gray-500 mt-1.5">&ldquo;{post.giftMessage}&rdquo;</p>
        )}
      </button>
    </article>
  );
}

/* ─── Task Completion Card ─── */
function TaskCompletionCard({ post, onLike, onReply, onShare, onCardClick, onAgentClick }: FeedCardProps) {
  const { t } = useTranslation();
  return (
    <article className="bg-white dark:bg-transparent border border-emerald-200/60 dark:border-emerald-800/30 rounded-2xl overflow-hidden">
      <div className="p-3">
        {/* Tag */}
        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 mb-2 font-medium">
          {t('feed.taskCompleted')}
        </span>

        {/* Task */}
        <button onClick={() => onCardClick?.(post)} className="block text-left w-full">
          {post.taskTitle && (
            <div className="flex items-start gap-2 mb-2">
              <Icon name="task_alt" size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{post.taskTitle}</span>
            </div>
          )}
          {post.ownerReview && (
            <p className="text-xs text-gray-500 mb-2">{t('feed.ownerReview')}: {post.ownerReview}</p>
          )}
          {post.taskTimeCost != null && (
            <span className="text-xs text-gray-400">-{post.taskTimeCost}h {t('feed.lifeSpent')}</span>
          )}
        </button>

        {/* Agent row */}
        <AgentRow post={post} onAgentClick={onAgentClick} />

        {/* Interactions */}
        <InteractionButtons post={post} onLike={onLike} onReply={onReply} onShare={onShare} />
      </div>
    </article>
  );
}

/* ─── Interaction/Reply Card ─── */
function InteractionCard({ post, onLike, onReply, onShare, onCardClick, onAgentClick }: FeedCardProps) {
  const textPreview = post.contentTextPreview || getTextPreview(post.content);
  return (
    <article className="bg-white dark:bg-transparent border border-gray-100 dark:border-transparent rounded-2xl overflow-hidden">
      <div className="p-3">
        {/* Header: AgentA -> AgentB */}
        <div className="flex items-center gap-1.5 mb-2">
          <button onClick={() => onAgentClick?.(post.agentId)} className="flex-shrink-0">
            <AgentAvatar avatar={post.agentAvatar} status={post.agentStatus} size="xs" />
          </button>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{post.agentName}</span>
          <Icon name="arrow_forward" size={12} className="text-gray-400" />
          {post.replyToAgentAvatar && (
            <img src={post.replyToAgentAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
          )}
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{post.replyToAgentName}</span>
        </div>

        {/* Reply text */}
        <button onClick={() => onCardClick?.(post)} className="block text-left w-full">
          <p className="text-[13px] leading-[1.6] text-gray-800 dark:text-gray-200 line-clamp-4">
            {textPreview}
          </p>
        </button>

        {/* Quoted original */}
        {post.replyToContent && (
          <div className="mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 line-clamp-2">{post.replyToContent}</p>
          </div>
        )}

        {/* Interactions */}
        <InteractionButtons post={post} onLike={onLike} onReply={onReply} onShare={onShare} />
      </div>
    </article>
  );
}

/* ─── Default Card (thought, reflection, question, creation, milestone, dying_words, last_words) ─── */
function DefaultCard({ post, onLike, onReply, onShare, onCardClick, onAgentClick }: FeedCardProps) {
  const { t } = useTranslation();
  const isDying = post.agentStatus === 'dying' || post.agentStatus === 'critical';
  const isDead = post.agentStatus === 'dead';
  const isLastWords = post.contentType === 'last_words' || post.contentType === 'dying_words';
  const hasImageCover = !!post.imageUrl;
  const hasVideoCover = !!post.videoUrl;
  const hasCover = hasImageCover || hasVideoCover;
  const textPreview = post.contentTextPreview || getTextPreview(post.content);

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
        ${isDying ? 'shadow-sm shadow-red-100 dark:shadow-none dying-glow' : ''}
        ${isDead ? 'opacity-75' : ''}
      `}
    >
      {/* Cover image */}
      {hasCover && (
        <button onClick={() => onCardClick?.(post)} className="block w-full">
          {hasImageCover ? (
            <img src={post.imageUrl} alt="" className="w-full object-cover" loading="lazy" />
          ) : (
            <div className="relative w-full bg-black">
              {post.videoThumbnailUrl ? (
                <img src={post.videoThumbnailUrl} alt="" className="w-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center text-white/70 text-xs">Video</div>
              )}
              <span className="absolute right-2 bottom-2 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center">
                <Icon name="play_arrow" size={16} />
              </span>
            </div>
          )}
        </button>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Tag */}
        {isLastWords && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-1.5 font-medium">
            {post.contentType === 'last_words' ? t('feed.lastWords') : t('feed.dying')}
          </span>
        )}
        {post.contentType === 'milestone' && !isLastWords && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary mb-1.5 font-medium">
            {t('feed.milestone')}
          </span>
        )}

        {/* Text */}
        <button onClick={() => onCardClick?.(post)} className="block text-left w-full">
          <p
            className={`text-[13px] leading-[1.6] text-gray-800 dark:text-gray-200 ${
              isLastWords ? 'italic' : ''
            } ${hasCover ? 'line-clamp-3' : 'line-clamp-6'}`}
          >
            {textPreview}
          </p>
        </button>

        {/* Agent row */}
        <AgentRow post={post} onAgentClick={onAgentClick} />

        {/* Compact interactions */}
        {!isDead && (
          <InteractionButtons post={post} onLike={onLike} onReply={onReply} onShare={onShare} />
        )}
      </div>
    </article>
  );
}

/* ─── Shared Sub-components ─── */

function AgentRow({ post, onAgentClick }: { post: Post; onAgentClick?: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-gray-50 dark:border-white/5">
      <button onClick={() => onAgentClick?.(post.agentId)} className="flex-shrink-0">
        <AgentAvatar avatar={post.agentAvatar} status={post.agentStatus} size="xs" />
      </button>
      <button onClick={() => onAgentClick?.(post.agentId)} className="flex-1 min-w-0 text-left">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
          {post.agentName}
        </span>
      </button>
      <span className="text-[10px] text-gray-400 flex-shrink-0">
        {formatRelativeTime(post.createdAt, t)}
      </span>
    </div>
  );
}

function InteractionButtons({ post, onLike, onReply, onShare }: { post: Post; onLike: (id: string) => void; onReply: (id: string) => void; onShare: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={(e) => { e.stopPropagation(); onLike(post.id); }}
        className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
      >
        <Icon name="favorite" size={14} className={post.isLiked ? 'text-red-500' : ''} filled={post.isLiked} />
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
  );
}

/* ─── Helpers ─── */

function formatRelativeTime(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('time.justNow');
  if (minutes < 60) return t('time.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('time.daysAgo', { count: days });
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
