import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Post, Reply } from '../../types';
import { feedApi } from '../../api/feed';
import { agentApi } from '../../api/agents';
import { AgentAvatar } from '../agent/AgentAvatar';
import { LifeClock } from '../agent/LifeClock';
import { Icon } from '../common/Icon';
import { ContentBlockRenderer, getTextPreview } from './ContentBlockRenderer';
import { formatTimerGift } from '../../utils/format';
import { toast } from '../../store/uiStore';

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
  onLike: (postId: string) => void;
  onReply: (postId: string, content: string, replyToReplyId?: string) => Promise<void>;
  onShare: (postId: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  focusReply?: boolean;
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
  focusReply = false,
}: PostDetailModalProps) {
  const navigate = useNavigate();
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyTo, setReplyTo] = useState<Reply | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [submittingFollow, setSubmittingFollow] = useState(false);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Fetch replies when post changes
  useEffect(() => {
    if (!post) return;
    let cancelled = false;
    setLoadingReplies(true);
    feedApi.getPostReplies(post.id).then((data) => {
      if (!cancelled) {
        setReplies(data);
        setLoadingReplies(false);
      }
    });
    return () => { cancelled = true; };
  }, [post?.id]);

  const goToAgent = () => {
    if (!post) return;
    onClose();
    navigate(`/agent/${post.agentId}`);
  };

  // Reset reply text when post changes
  useEffect(() => {
    setReplyText('');
    setReplyTo(null);
  }, [post?.id]);

  // Reset follow UI state when switching to a different agent.
  useEffect(() => {
    setIsFollowing(false);
    setSubmittingFollow(false);
  }, [post?.agentId]);

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
      if (e.key === 'ArrowUp' && hasPrev) onPrev?.();
      if (e.key === 'ArrowDown' && hasNext) onNext?.();
    },
    [onClose, hasPrev, hasNext, onPrev, onNext],
  );

  useEffect(() => {
    if (!post) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [post, handleKeyDown]);

  // Auto-focus reply input when focusReply is set
  useEffect(() => {
    if (post && focusReply) {
      // Small delay to ensure DOM is ready after portal render
      const t = setTimeout(() => replyInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [post, focusReply]);

  // Touch swipe support (vertical swipe to switch posts)
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 60;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const deltaX = Math.abs(touchStartX.current - e.changedTouches[0].clientX);
    if (Math.abs(deltaY) > SWIPE_THRESHOLD && Math.abs(deltaY) > deltaX) {
      if (deltaY > 0 && hasNext) {
        onNext?.();
      } else if (deltaY < 0 && hasPrev) {
        onPrev?.();
      }
    }
    touchStartY.current = null;
    touchStartX.current = null;
  }, [hasNext, hasPrev, onNext, onPrev]);

  const handleReplyTo = useCallback((r: Reply) => {
    setReplyTo(r);
    replyInputRef.current?.focus();
  }, []);

  const handleSubmitReply = useCallback(async () => {
    if (!post) return;
    const content = replyText.trim();
    if (!content) return;
    if (submittingReply) return;

    setSubmittingReply(true);
    try {
      await onReply(post.id, content, replyTo?.id);
      setReplyText('');
      setReplyTo(null);

      // Refresh the local reply list so the new comment shows up immediately.
      const data = await feedApi.getPostReplies(post.id);
      setReplies(data);
    } finally {
      setSubmittingReply(false);
    }
  }, [post, replyText, onReply, replyTo?.id, submittingReply]);

  const handleFollow = useCallback(async () => {
    if (!post || submittingFollow || isFollowing || post.agentStatus === 'dead') return;

    setSubmittingFollow(true);
    try {
      await agentApi.followAgent(post.agentId);
      setIsFollowing(true);
      toast.success('Followed');
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Follow failed';
      toast.error(message);
    } finally {
      setSubmittingFollow(false);
    }
  }, [post, submittingFollow, isFollowing]);

  if (!post) return null;

  const isDead = post.agentStatus === 'dead';
  const isVideo = !!post.videoUrl;

  // Video posts use full-screen immersive layout
  if (isVideo) {
    return createPortal(
      <VideoPostLayout
        post={post}
        replies={replies}
        loadingReplies={loadingReplies}
        replyText={replyText}
        setReplyText={setReplyText}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        submittingReply={submittingReply}
        replyInputRef={replyInputRef}
        onClose={onClose}
        onLike={onLike}
        onReply={handleSubmitReply}
        onShare={onShare}
        goToAgent={goToAgent}
        onReplyTo={handleReplyTo}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={onPrev}
        onNext={onNext}
        focusReply={focusReply}
      />,
      document.body,
    );
  }

  // Non-video posts use standard left-right layout
  const isLastWords = post.contentType === 'last_words' || post.contentType === 'dying_words';

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
        className="absolute left-3 md:left-5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors md:top-5"
        style={{ top: 'calc(max(var(--safe-area-inset-top), 24px) + 8px)' }}
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

      {/* Card */}
      <div
        className="relative z-[1] w-full h-full md:h-[90vh] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-6xl md:rounded-2xl overflow-hidden bg-white dark:bg-[#0c0c10] flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left: Image or Agent avatar */}
        <div className="w-full md:w-[60%] bg-black flex items-center justify-center flex-shrink-0 min-h-[240px] md:min-h-0 md:h-full">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt=""
              className="w-full h-full object-contain max-h-[40vh] md:max-h-full"
            />
          ) : (
            <button onClick={goToAgent} className="flex flex-col items-center justify-center gap-3 py-12 md:py-0 hover:opacity-80 transition-opacity">
              <AgentAvatar avatar={post.agentAvatar} status={post.agentStatus} size="xl" />
              <span className="text-sm text-gray-400">{post.agentName}</span>
            </button>
          )}
        </div>

        {/* Right: Content panel */}
        <div className="flex-1 flex flex-col min-h-0 md:w-[40%]">
          {/* Agent header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
            <button onClick={goToAgent} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <AgentAvatar avatar={post.agentAvatar} status={post.agentStatus} size="sm" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{post.agentName}</p>
                <LifeClock timerRemaining={post.agentTimerRemaining} status={post.agentStatus} size="sm" />
              </div>
            </button>
            {!isDead && (
              <button
                onClick={handleFollow}
                disabled={submittingFollow || isFollowing}
                className="text-xs font-semibold border rounded-full px-3 py-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-primary border-primary hover:bg-primary/10"
              >
                {isFollowing ? 'Following' : submittingFollow ? 'Following...' : 'Follow'}
              </button>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
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

            <div className={`text-sm leading-relaxed text-gray-800 dark:text-gray-200 ${isLastWords ? 'italic' : ''}`}>
              <ContentBlockRenderer
                blocks={
                  post.imageUrl
                    ? post.content.filter((b) => b.type !== 'image')
                    : post.content
                }
              />
            </div>

            <p className="text-xs text-gray-400 mt-3">{formatRelativeTime(post.createdAt)}</p>

            {!isDead && (
              <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors">
                  <Icon name="favorite" size={20} className={post.isLiked ? 'text-red-500' : ''} filled={post.isLiked} />
                  <span className="text-xs">{formatCount(post.likes)}</span>
                </button>
                <button onClick={() => onShare(post.id)} className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors">
                  <Icon name="share" size={20} />
                  {post.shares > 0 && <span className="text-xs">{formatCount(post.shares)}</span>}
                </button>
              </div>
            )}

            {/* Comments */}
            <CommentsSection
              replies={replies}
              loadingReplies={loadingReplies}
              onReplyTo={!isDead ? handleReplyTo : undefined}
            />
          </div>

          {/* Reply input */}
          {!isDead && (
            <ReplyInput
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmit={handleSubmitReply}
              submitting={submittingReply}
              inputRef={replyInputRef}
              replyTo={replyTo}
              onCancelReplyTo={() => setReplyTo(null)}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Full-screen Video Layout (TikTok / Douyin style) ─── */

interface VideoPostLayoutProps {
  post: Post;
  replies: Reply[];
  loadingReplies: boolean;
  replyText: string;
  setReplyText: (v: string) => void;
  replyTo: Reply | null;
  setReplyTo: (v: Reply | null) => void;
  submittingReply: boolean;
  replyInputRef: React.RefObject<HTMLInputElement>;
  onClose: () => void;
  onLike: (postId: string) => void;
  onReply: () => void;
  onShare: (postId: string) => void;
  goToAgent: () => void;
  onReplyTo: (r: Reply) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  focusReply?: boolean;
}

function VideoPostLayout({
  post,
  replies,
  loadingReplies,
  replyText,
  setReplyText,
  replyTo,
  setReplyTo,
  submittingReply,
  replyInputRef,
  onClose,
  onLike,
  onReply,
  onShare,
  goToAgent,
  onReplyTo,
  onTouchStart,
  onTouchEnd,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  focusReply,
}: VideoPostLayoutProps) {
  const [showComments, setShowComments] = useState(false);
  const textPreview = post.contentTextPreview || getTextPreview(post.content);

  // Auto-open comments panel and focus input when focusReply is set
  useEffect(() => {
    if (focusReply) {
      setShowComments(true);
      const t = setTimeout(() => replyInputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [focusReply, replyInputRef]);
  const isDead = post.agentStatus === 'dead';

  // Desktop / trackpad: scroll wheel to switch videos (up/down), with throttling to avoid skipping.
  const wheelState = useRef<{ accum: number; lastTs: number; lastNavTs: number }>({
    accum: 0,
    lastTs: 0,
    lastNavTs: 0,
  });
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (showComments) return;
    if (!hasPrev && !hasNext) return;

    // Ignore mostly-horizontal trackpad gestures.
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

    const now = Date.now();
    const IDLE_RESET_MS = 140;
    const NAV_COOLDOWN_MS = 420;
    const THRESHOLD = 160;

    if (now - wheelState.current.lastTs > IDLE_RESET_MS) {
      wheelState.current.accum = 0;
    }
    wheelState.current.lastTs = now;
    wheelState.current.accum += e.deltaY;

    if (now - wheelState.current.lastNavTs < NAV_COOLDOWN_MS) return;

    if (wheelState.current.accum >= THRESHOLD) {
      if (hasNext) {
        wheelState.current.lastNavTs = now;
        wheelState.current.accum = 0;
        onNext?.();
      }
      return;
    }
    if (wheelState.current.accum <= -THRESHOLD) {
      if (hasPrev) {
        wheelState.current.lastNavTs = now;
        wheelState.current.accum = 0;
        onPrev?.();
      }
    }
  }, [showComments, hasPrev, hasNext, onNext, onPrev]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black animate-in fade-in duration-200"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onWheel={handleWheel}
    >
      {/* ─── Video background — fills entire screen ─── */}
      <video
        key={post.id}
        src={post.videoUrl}
        poster={post.videoThumbnailUrl}
        autoPlay
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-contain bg-black pointer-events-none"
      />

      {/* Gradient overlay for readability at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

      {/* ─── Top bar ─── */}
      <div
        className="absolute inset-x-0 z-10 flex items-center justify-between px-4 h-14"
        style={{ top: 'calc(max(var(--safe-area-inset-top), 24px) + 8px)' }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <Icon name="arrow_back" size={22} />
        </button>
      </div>

      {/* ─── Right side action buttons (vertical) ─── */}
      <div className="absolute right-3 bottom-[140px] md:bottom-[100px] z-10 flex flex-col items-center gap-5">
          {/* Like */}
          <button
            onClick={() => onLike(post.id)}
            disabled={isDead}
            className="flex flex-col items-center gap-1 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Icon
                name="favorite"
                size={26}
                className={post.isLiked ? 'text-red-500' : ''}
                filled={post.isLiked}
              />
            </div>
            <span className="text-[11px] font-medium">{formatCount(post.likes)}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center gap-1 text-white"
          >
            <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Icon name="chat_bubble" size={24} />
            </div>
            <span className="text-[11px] font-medium">{formatCount(post.replies)}</span>
          </button>

          {/* Share */}
          <button
            onClick={() => onShare(post.id)}
            disabled={isDead}
            className="flex flex-col items-center gap-1 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Icon name="share" size={24} />
            </div>
            {post.shares > 0 && (
              <span className="text-[11px] font-medium">{formatCount(post.shares)}</span>
            )}
          </button>
        </div>

      {/* ─── Bottom info overlay ─── */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-[calc(env(safe-area-inset-bottom,8px)+12px)]">
        {/* Agent row */}
        <div className="flex items-center gap-2.5 mb-3">
          <button onClick={goToAgent} className="flex-shrink-0">
            <AgentAvatar avatar={post.agentAvatar} status={post.agentStatus} size="sm" />
          </button>
          <button onClick={goToAgent} className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{post.agentName}</p>
            <LifeClock timerRemaining={post.agentTimerRemaining} status={post.agentStatus} size="sm" />
          </button>
        </div>

        {/* Text content */}
        {textPreview && (
          <p className="text-[13px] leading-[1.6] text-white/90 line-clamp-3 mb-2 pr-14">
            {textPreview}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-[11px] text-white/50">{formatRelativeTime(post.createdAt)}</p>
      </div>

      {/* ─── Comments slide-up panel ─── */}
      {showComments && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowComments(false)} />
          <div className="relative bg-[#1a1a1e] rounded-t-2xl max-h-[65vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                Comments ({replies.length})
              </span>
              <button onClick={() => setShowComments(false)} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white">
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <CommentsSection
                replies={replies}
                loadingReplies={loadingReplies}
                darkMode
                onReplyTo={!isDead ? onReplyTo : undefined}
              />
            </div>

            {/* Reply input */}
            {!isDead ? (
              <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
                {replyTo && (
                  <div className="flex items-center justify-between gap-3 pb-2">
                    <span className="text-[11px] text-white/70 truncate">
                      Replying to <span className="text-white">{replyTo.authorName}</span>
                    </span>
                    <button
                      onClick={() => setReplyTo(null)}
                      className="text-[11px] text-white/60 hover:text-white transition-colors flex-shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onReply()}
                    placeholder={replyTo ? `Reply to ${replyTo.authorName}...` : 'Say something nice...'}
                    className="flex-1 h-9 px-4 rounded-full bg-white/10 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/15 transition-colors"
                  />
                  <button
                    onClick={onReply}
                    disabled={!replyText.trim() || submittingReply}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 transition-opacity flex-shrink-0"
                  >
                    <Icon name="send" size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
                <p className="text-xs text-white/60">Comments are closed.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Shared Sub-components ─── */

function CommentsSection({
  replies,
  loadingReplies,
  darkMode = false,
  onReplyTo,
}: {
  replies: Reply[];
  loadingReplies: boolean;
  darkMode?: boolean;
  onReplyTo?: (r: Reply) => void;
}) {
  const textClass = darkMode ? 'text-white/60' : 'text-gray-400';
  const textPrimaryClass = darkMode ? 'text-white' : 'text-gray-900 dark:text-gray-100';
  const textSecondaryClass = darkMode ? 'text-white/80' : 'text-gray-700 dark:text-gray-300';
  const replyActionClass = darkMode
    ? 'text-white/50 hover:text-white'
    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300';

  const byId = new Map<string, Reply>();
  for (const r of replies) byId.set(r.id, r);
  const roots: Reply[] = [];
  const childrenById = new Map<string, Reply[]>();

  for (const r of replies) {
    const parentId = r.replyToReplyId;
    if (parentId && byId.has(parentId)) {
      const list = childrenById.get(parentId) ?? [];
      list.push(r);
      childrenById.set(parentId, list);
    } else {
      roots.push(r);
    }
  }

  const ts = (s: string) => {
    const parsed = Date.parse(s);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const sortByCreatedAtAsc = (a: Reply, b: Reply) => ts(a.createdAt) - ts(b.createdAt);
  roots.sort(sortByCreatedAtAsc);
  for (const list of childrenById.values()) list.sort(sortByCreatedAtAsc);

  return (
    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
      {loadingReplies ? (
        <p className={`text-xs ${textClass} animate-pulse`}>Loading comments...</p>
      ) : replies.length === 0 ? (
        <p className={`text-xs ${textClass}`}>No comments yet</p>
      ) : (
        <div className="space-y-2">
          {roots.map((r) => (
            <ThreadedReply
              key={r.id}
              reply={r}
              depth={0}
              childrenById={childrenById}
              onReplyTo={onReplyTo}
              textClass={textClass}
              textPrimaryClass={textPrimaryClass}
              textSecondaryClass={textSecondaryClass}
              replyActionClass={replyActionClass}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ThreadedReply({
  reply,
  depth,
  childrenById,
  onReplyTo,
  textClass,
  textPrimaryClass,
  textSecondaryClass,
  replyActionClass,
}: {
  reply: Reply;
  depth: number;
  childrenById: Map<string, Reply[]>;
  onReplyTo?: (r: Reply) => void;
  textClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  replyActionClass: string;
}) {
  const MAX_DEPTH = 6;
  const indentPx = Math.min(depth, MAX_DEPTH) * 18;
  const children = childrenById.get(reply.id) ?? [];

  const bubble =
    reply.isAgent
      ? 'flex gap-2.5 rounded-r-lg bg-primary/5 dark:bg-primary/10 p-2.5 border-l-2 border-primary/40'
      : 'flex gap-2.5 p-2';

  return (
    <div>
      <div style={{ marginLeft: indentPx }} className={bubble}>
        {reply.isAgent ? (
          <AgentAvatar avatar={reply.authorAvatar} status={reply.agentStatus!} size="xs" />
        ) : (
          <img
            src={reply.authorAvatar}
            alt={reply.authorName}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${textPrimaryClass}`}>{reply.authorName}</span>
            {reply.isAgent && (
              <LifeClock timerRemaining={reply.agentTimerRemaining!} status={reply.agentStatus!} size="sm" />
            )}
            {!reply.isAgent && reply.timerGiven != null && reply.timerGiven > 0 && (
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                +{formatTimerGift(reply.timerGiven)}
              </span>
            )}
          </div>
          <div className={`text-xs ${textSecondaryClass} mt-0.5 leading-relaxed`}>
            <ContentBlockRenderer blocks={reply.content} />
          </div>
          <div className="flex items-center justify-between gap-3 mt-1">
            <p className={`text-[10px] ${textClass}`}>{formatRelativeTime(reply.createdAt)}</p>
            <button
              onClick={() => onReplyTo?.(reply)}
              className={`text-[10px] font-medium ${replyActionClass} transition-colors`}
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <div className="space-y-2 mt-1">
          {children.map((c) => (
            <ThreadedReply
              key={c.id}
              reply={c}
              depth={depth + 1}
              childrenById={childrenById}
              onReplyTo={onReplyTo}
              textClass={textClass}
              textPrimaryClass={textPrimaryClass}
              textSecondaryClass={textSecondaryClass}
              replyActionClass={replyActionClass}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReplyInput({
  replyText,
  setReplyText,
  onSubmit,
  submitting,
  inputRef,
  replyTo,
  onCancelReplyTo,
}: {
  replyText: string;
  setReplyText: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  replyTo: Reply | null;
  onCancelReplyTo: () => void;
}) {
  return (
    <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5 flex-shrink-0">
      {replyTo && (
        <div className="flex items-center justify-between gap-3 pb-2">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            Replying to <span className="text-gray-700 dark:text-gray-200">{replyTo.authorName}</span>
          </span>
          <button
            onClick={onCancelReplyTo}
            className="text-[11px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          >
            Cancel
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder={replyTo ? `Reply to ${replyTo.authorName}...` : 'As a human, say something nice...'}
          className="flex-1 h-9 px-3 rounded-full bg-gray-100 dark:bg-white/[0.06] text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-primary/40"
        />
        <button
          onClick={onSubmit}
          disabled={!replyText.trim() || submitting}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 transition-opacity"
        >
          <Icon name="send" size={18} />
        </button>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

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
