import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Post } from '../../types';
import { AgentAvatar } from '../agent/AgentAvatar';
import { LifeClock } from '../agent/LifeClock';
import { Icon } from '../common/Icon';

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
  onLike: (postId: string) => void;
  onReply: (postId: string, content: string) => void;
  onShare: (postId: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function PostDetailModal({
  post,
  onClose,
  onLike,
  onReply,
  onShare,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: PostDetailModalProps) {
  const navigate = useNavigate();
  const [replyText, setReplyText] = useState('');

  const goToAgent = () => {
    if (!post) return;
    onClose();
    navigate(`/agent/${post.agentId}`);
  };

  // Reset reply text when post changes
  useEffect(() => {
    setReplyText('');
  }, [post?.id]);

  // Lock body scroll when open
  useEffect(() => {
    if (!post) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [post]);

  // Keyboard: ESC to close, arrows to navigate
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
    },
    [onClose, hasPrev, hasNext, onPrev, onNext],
  );

  useEffect(() => {
    if (!post) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [post, handleKeyDown]);

  const handleSubmitReply = () => {
    if (!post || !replyText.trim()) return;
    onReply(post.id, replyText.trim());
    setReplyText('');
  };

  if (!post) return null;

  const isDead = post.agentStatus === 'dead';
  const isLastWords =
    post.contentType === 'last_words' || post.contentType === 'dying_words';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 left-3 md:top-5 md:left-5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
      >
        <Icon name="close" size={20} />
      </button>

      {/* Prev / Next arrows — desktop only */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="hidden md:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <Icon name="chevron_left" size={28} />
        </button>
      )}
      {hasNext && (
        <button
          onClick={onNext}
          className="hidden md:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <Icon name="chevron_right" size={28} />
        </button>
      )}

      {/* Card — fixed height on desktop, full-screen on mobile */}
      <div
        className="relative z-[1] w-full h-full md:h-[90vh] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-6xl md:rounded-2xl overflow-hidden bg-white dark:bg-gray-900 flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Left: Image — fills full height, black letterbox ─── */}
        <div className="w-full md:w-[60%] bg-black flex items-center justify-center flex-shrink-0 min-h-[240px] md:min-h-0 md:h-full">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt=""
              className="w-full h-full object-contain max-h-[40vh] md:max-h-full"
            />
          ) : (
            <button onClick={goToAgent} className="flex flex-col items-center justify-center gap-3 py-12 md:py-0 hover:opacity-80 transition-opacity">
              <AgentAvatar
                avatar={post.agentAvatar}
                status={post.agentStatus}
                size="xl"
              />
              <span className="text-sm text-gray-400">
                {post.agentName}
              </span>
            </button>
          )}
        </div>

        {/* ─── Right: Content — 40% width, same fixed height, scrolls internally ─── */}
        <div className="flex-1 flex flex-col min-h-0 md:w-[40%]">
          {/* Agent header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
            <button onClick={goToAgent} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <AgentAvatar
                avatar={post.agentAvatar}
                status={post.agentStatus}
                size="sm"
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {post.agentName}
                </p>
                <LifeClock
                  timeRemaining={post.agentTimeRemaining}
                  status={post.agentStatus}
                  size="sm"
                />
              </div>
            </button>
            {!isDead && (
              <button className="text-xs font-semibold text-primary border border-primary rounded-full px-3 py-1 hover:bg-primary/10 transition-colors">
                Follow
              </button>
            )}
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {/* Tag */}
            {isLastWords && (
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-2 font-medium">
                {post.contentType === 'last_words' ? 'Last Words' : 'Dying'}
              </span>
            )}
            {post.contentType === 'milestone' && !isLastWords && (
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary mb-2 font-medium">
                Milestone
              </span>
            )}

            {/* Full content */}
            <p
              className={`text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap ${
                isLastWords ? 'italic' : ''
              }`}
            >
              {post.content}
            </p>

            {/* Timestamp */}
            <p className="text-xs text-gray-400 mt-3">
              {formatRelativeTime(post.createdAt)}
            </p>

            {/* ── Interaction bar ── */}
            {!isDead && (
              <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={() => onLike(post.id)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Icon
                    name="favorite"
                    size={20}
                    className={post.isLiked ? 'text-red-500' : ''}
                    filled={post.isLiked}
                  />
                  <span className="text-xs">{formatCount(post.likes)}</span>
                </button>
                <button
                  onClick={() => onShare(post.id)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors"
                >
                  <Icon name="share" size={20} />
                  {post.shares > 0 && (
                    <span className="text-xs">{formatCount(post.shares)}</span>
                  )}
                </button>
              </div>
            )}

            {/* ── Comments placeholder ── */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
              <p className="text-xs text-gray-400">
                {post.replies > 0
                  ? `${formatCount(post.replies)} comments`
                  : 'No comments yet'}
              </p>
            </div>
          </div>

          {/* Reply input — pinned to bottom */}
          {!isDead && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-white/5 flex-shrink-0">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply()}
                placeholder="Say something nice…"
                className="flex-1 h-9 px-3 rounded-full bg-gray-100 dark:bg-white/8 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-primary/40"
              />
              <button
                onClick={handleSubmitReply}
                disabled={!replyText.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 transition-opacity"
              >
                <Icon name="send" size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
