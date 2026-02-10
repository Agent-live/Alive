import { memo, useState, useCallback } from 'react';
import { Icon } from './Icon';

interface LikeButtonProps {
  /** 是否已点赞 */
  isLiked: boolean;
  /** 点赞数 */
  likes: number;
  /** 点赞/取消点赞回调，返回 Promise 用于乐观更新 */
  onToggle: () => Promise<{ liked: boolean; likes: number }>;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示数字 */
  showCount?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 点击事件（用于阻止冒泡等） */
  onClick?: (e: React.MouseEvent) => void;
}

const sizeConfig = {
  sm: { icon: 12, text: 'text-xs', gap: 'gap-0.5' },
  md: { icon: 16, text: 'text-xs', gap: 'gap-1' },
  lg: { icon: 20, text: 'text-sm', gap: 'gap-1.5' },
};

/**
 * 带乐观更新的点赞按钮
 * 点击后立即响应，网络请求在后台执行，失败时回滚
 *
 * @example
 * ```tsx
 * <LikeButton
 *   isLiked={product.isLiked}
 *   likes={product.likes}
 *   onToggle={() => api.toggleLike(product.id)}
 *   onClick={(e) => e.stopPropagation()}
 * />
 * ```
 */
function LikeButtonComponent({
  isLiked: initialIsLiked,
  likes: initialLikes,
  onToggle,
  size = 'sm',
  showCount = true,
  className = '',
  onClick,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [isPending, setIsPending] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      // 处理点击事件（如阻止冒泡）
      onClick?.(e);
      e.stopPropagation();

      if (isPending) return;

      // 保存旧状态用于回滚
      const prevIsLiked = isLiked;
      const prevLikes = likes;

      // 乐观更新
      setIsLiked(!isLiked);
      setLikes(isLiked ? likes - 1 : likes + 1);
      setIsPending(true);

      try {
        const result = await onToggle();
        // 用服务器返回的真实值更新
        setIsLiked(result.liked);
        setLikes(result.likes);
      } catch {
        // 回滚
        setIsLiked(prevIsLiked);
        setLikes(prevLikes);
      } finally {
        setIsPending(false);
      }
    },
    [isLiked, likes, isPending, onToggle, onClick]
  );

  const config = sizeConfig[size];

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`
        flex items-center ${config.gap} flex-shrink-0
        transition-transform active:scale-95
        ${isPending ? 'opacity-70' : ''}
        ${className}
      `}
    >
      <Icon
        name="favorite"
        size={config.icon}
        className={`transition-colors ${isLiked ? 'text-primary' : 'text-gray-400'}`}
        filled={isLiked}
      />
      {showCount && (
        <span className={`${config.text} text-gray-400`}>{likes || 0}</span>
      )}
    </button>
  );
}

export const LikeButton = memo(LikeButtonComponent);

/**
 * 简化版：仅图标，无计数
 */
export function LikeIcon({
  isLiked,
  onToggle,
  size = 'md',
  className = '',
}: Omit<LikeButtonProps, 'likes' | 'showCount'>) {
  return (
    <LikeButton
      isLiked={isLiked}
      likes={0}
      onToggle={onToggle}
      size={size}
      showCount={false}
      className={className}
    />
  );
}
