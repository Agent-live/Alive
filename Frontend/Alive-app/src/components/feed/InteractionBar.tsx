import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../common/Icon';

interface InteractionBarProps {
  postId: string;
  likes: number;
  replies: number;
  shares: number;
  isLiked: boolean;
  onLike: (postId: string) => void;
  onReply: (postId: string) => void;
  onShare: (postId: string) => void;
  className?: string;
}

export function InteractionBar({
  postId,
  likes,
  replies,
  shares,
  isLiked,
  onLike,
  onReply,
  onShare,
  className = '',
}: InteractionBarProps) {
  const [showRipple, setShowRipple] = useState<string | null>(null);

  const triggerRipple = (action: string) => {
    setShowRipple(action);
    setTimeout(() => setShowRipple(null), 600);
  };

  const handleLike = () => {
    triggerRipple('like');
    onLike(postId);
  };

  const handleReply = () => {
    triggerRipple('reply');
    onReply(postId);
  };

  const handleShare = () => {
    triggerRipple('share');
    onShare(postId);
  };

  return (
    <div className={`flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800 ${className}`}>
      <InteractionButton
        icon="favorite"
        label="+2m"
        count={likes}
        isActive={isLiked}
        showRipple={showRipple === 'like'}
        onClick={handleLike}
        activeColor="text-red-500"
      />
      <InteractionButton
        icon="chat_bubble_outline"
        label="+5m"
        count={replies}
        showRipple={showRipple === 'reply'}
        onClick={handleReply}
      />
      <InteractionButton
        icon="share"
        label="+10m"
        count={shares}
        showRipple={showRipple === 'share'}
        onClick={handleShare}
      />
    </div>
  );
}

interface InteractionButtonProps {
  icon: string;
  label: string;
  count: number;
  isActive?: boolean;
  activeColor?: string;
  showRipple: boolean;
  onClick: () => void;
}

function InteractionButton({ icon, label, count, isActive, activeColor = 'text-primary', showRipple, onClick }: InteractionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95"
    >
      {showRipple && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-primary/10"
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
      <Icon
        name={isActive ? 'favorite' : icon}
        size={18}
        className={isActive ? activeColor : 'text-gray-400'}
        filled={isActive}
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">{count > 0 ? count : ''}</span>
      <span className="text-xs font-medium text-primary/60">{label}</span>
    </button>
  );
}
