import { memo } from 'react';
import { WishCard as WishCardType } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components';

interface WishCardProps {
  wish: WishCardType;
  variant?: 'default' | 'compact' | 'featured' | 'horizontal' | 'large';
  className?: string;
  onJoin?: () => void;
}

export const WishCard = memo(function WishCard({
  wish,
  variant = 'default',
  className = '',
  onJoin,
}: WishCardProps) {
  const navigate = useNavigate();
  const remaining = wish.targetCount - wish.currentCount;
  const isAlmostThere = wish.progress >= 80;
  const isUrgent = wish.remainingTime < 24 * 60 * 60; // 24小时内
  const daysLeft = Math.ceil(wish.remainingTime / 86400);

  const handleClick = () => {
    navigate(`/wish/${wish.id}`);
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin();
    } else {
      navigate(`/wish/${wish.id}`);
    }
  };

  // 新增：大卡片 - 适合首页/推荐位
  if (variant === 'large') {
    return (
      <div
        onClick={handleClick}
        className={`surface-card rounded-xl overflow-hidden shadow-md cursor-pointer active:scale-[0.98] transition-all hover:shadow-lg ${className}`}
      >
        {/* 图片区域 - 大尺寸 */}
        <div className="relative aspect-[4/3]">
          <img
            src={wish.product.image}
            alt={wish.product.name}
            className="w-full h-full object-cover"
          />
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* 状态标签 */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isAlmostThere && (
              <span className="px-2.5 py-1 rounded-full bg-primary text-white text-xs font-medium flex items-center gap-1">
                <Icon name="local_fire_department" size={14} />
                还差{remaining}人
              </span>
            )}
            {isUrgent && (
              <span className="px-2.5 py-1 rounded-full bg-warning text-white text-xs font-medium flex items-center gap-1">
                <Icon name="schedule" size={14} />
                {daysLeft > 0 ? `${daysLeft}天` : '即将结束'}
              </span>
            )}
          </div>

          {/* 底部信息 */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-white text-lg line-clamp-2 mb-2">
              {wish.product.name}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-lg">
                  ¥{wish.groupPrice}
                </span>
                <span className="line-through text-white/50 text-sm">
                  ¥{wish.originalPrice}
                </span>
                <span className="px-2 py-0.5 bg-primary/80 text-white text-xs rounded">
                  省{wish.savingsPercent}%
                </span>
              </div>
              <AvatarStack avatars={wish.participantAvatars} size="sm" light />
            </div>
          </div>
        </div>

        {/* 进度区域 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="text-primary font-bold text-base">{wish.currentCount}</span>
              <span className="text-gray-400 dark:text-gray-500">/{wish.targetCount}人参与</span>
            </span>
            <span className="text-sm font-bold text-primary">
              {wish.progress}%
            </span>
          </div>
          <ProgressBar progress={wish.progress} />
        </div>
      </div>
    );
  }

  // 新增：横向卡片 - 适合列表展示
  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleClick}
        className={`surface-card rounded-xl overflow-hidden shadow-md cursor-pointer active:scale-[0.99] transition-all hover:shadow-lg ${className}`}
      >
        <div className="flex">
          {/* 图片 - 正方形，更大尺寸 */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <img
              src={wish.product.image}
              alt={wish.product.name}
              className="w-full h-full object-cover"
            />
            {/* 状态角标 */}
            {isAlmostThere && (
              <div className="absolute top-0 left-0 bg-primary text-white text-xs px-2 py-0.5 rounded-br-lg font-medium">
                🔥 快达成
              </div>
            )}
          </div>

          {/* 内容区 - 增加内边距 */}
          <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
            {/* 顶部：标题+标签 */}
            <div>
              <div className="flex items-start gap-2">
                <h3 className="flex-1 font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                  {wish.product.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-primary font-bold text-sm">¥{wish.groupPrice}</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs line-through">¥{wish.originalPrice}</span>
                <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
                  省{wish.savingsPercent}%
                </span>
              </div>
            </div>

            {/* 中间：进度 */}
            <div className="my-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500 dark:text-gray-400">
                  <span className="text-primary font-bold">{wish.currentCount}</span>/{wish.targetCount}人
                </span>
                <span className="text-gray-400 dark:text-gray-500">
                  {daysLeft > 0 ? `剩${daysLeft}天` : '即将结束'}
                </span>
              </div>
              <ProgressBar progress={wish.progress} />
            </div>

            {/* 底部：头像+按钮 */}
            <div className="flex items-center justify-between">
              <AvatarStack avatars={wish.participantAvatars} size="xs" max={4} />
              <button
                onClick={handleJoin}
                className="px-4 py-1.5 bg-gradient-primary text-white text-xs font-semibold rounded-full shadow-button active:scale-95 transition-all"
              >
                +加入
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={`flex gap-3 p-3 surface-card rounded-lg cursor-pointer active:scale-[0.98] transition-transform ${className}`}
      >
        <div className="size-16 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={wish.product.image}
            alt={wish.product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
            {wish.product.name}
          </h3>
          <p className="text-primary text-xs mt-1">
            还差 {remaining} 人 · {getEmotionalProgress(wish.progress)}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <AvatarStack avatars={wish.participantAvatars} size="sm" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        onClick={handleClick}
        className={`surface-card rounded-xl overflow-hidden shadow-card cursor-pointer active:scale-[0.98] transition-transform ${className}`}
      >
        {/* 图片区域 */}
        <div className="relative aspect-[4/3]">
          <img
            src={wish.product.image}
            alt={wish.product.name}
            className="w-full h-full object-cover"
          />
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* 状态标签 */}
          <div className="absolute top-3 left-3">
            {isAlmostThere && (
              <span className="px-2 py-1 rounded-full bg-primary text-white text-xs font-medium">
                🔥 即将达成
              </span>
            )}
          </div>
          {/* 底部信息 */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-bold text-white text-lg line-clamp-1">
              {wish.product.name}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <span className="text-white/90 text-sm">
                ¥{wish.groupPrice}
                <span className="line-through text-white/50 ml-1 text-xs">
                  ¥{wish.originalPrice}
                </span>
              </span>
              <AvatarStack avatars={wish.participantAvatars} size="sm" light />
            </div>
          </div>
        </div>
        {/* 进度区域 */}
        <div className="p-3">
          <ProgressBar progress={wish.progress} showLabel />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
            {getEmotionalMessage(remaining, wish.progress, isUrgent)}
          </p>
        </div>
      </div>
    );
  }

  // 默认卡片 - 优化版本，适合网格展示
  return (
    <div
      onClick={handleClick}
      className={`surface-card rounded-xl overflow-hidden shadow-md cursor-pointer active:scale-[0.98] transition-all hover:shadow-lg ${className}`}
    >
      {/* 图片 */}
      <div className="relative aspect-[3/4]">
        <img
          src={wish.product.image}
          alt={wish.product.name}
          className="w-full h-full object-cover"
        />
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* 状态角标 */}
        {isAlmostThere && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 rounded-full bg-primary text-white text-xs font-medium flex items-center gap-1">
              🔥 快达成
            </span>
          </div>
        )}
        {isUrgent && !isAlmostThere && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 rounded-full bg-warning text-white text-xs font-medium">
              即将结束
            </span>
          </div>
        )}

        {/* 底部价格叠加 */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">¥{wish.groupPrice}</span>
            <span className="text-white/60 text-xs line-through">¥{wish.originalPrice}</span>
          </div>
        </div>

      </div>
      {/* 信息 */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-tight">
          {wish.product.name}
        </h3>

        {/* 进度 */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">
              <span className="text-primary font-bold">{wish.currentCount}</span>/{wish.targetCount}人
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              还差{remaining}人
            </span>
          </div>
          <ProgressBar progress={wish.progress} />
        </div>

        {/* 底部：头像+按钮 */}
        <div className="flex items-center justify-between mt-2.5">
          <AvatarStack avatars={wish.participantAvatars} size="xs" max={3} />
          <button
            onClick={handleJoin}
            className="px-3 py-1 bg-gradient-primary text-white text-xs font-semibold rounded-full shadow-button active:scale-95 transition-all"
          >
            +加入
          </button>
        </div>
      </div>
    </div>
  );
})

// 进度条组件 - 优化：更粗、更鲜艳
interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  className?: string;
}

function ProgressBar({ progress, showLabel, className = '' }: ProgressBarProps) {
  const isAlmostThere = progress >= 80;

  return (
    <div className={className}>
      <div className="h-2 surface-inset rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isAlmostThere
              ? 'bg-gradient-to-r from-rose-400 via-primary to-amber-400'
              : 'bg-gradient-to-r from-primary to-primary-light'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">{progress}%</span>
          {isAlmostThere && (
            <span className="text-xs text-primary font-medium">🎉 快达成了！</span>
          )}
        </div>
      )}
    </div>
  );
}

// 头像堆叠组件
interface AvatarStackProps {
  avatars: string[];
  size?: 'xs' | 'sm' | 'md';
  light?: boolean;
  max?: number;
}

export function AvatarStack({
  avatars,
  size = 'sm',
  light = false,
  max = 4,
}: AvatarStackProps) {
  const sizeClass = {
    xs: 'size-5',
    sm: 'size-6',
    md: 'size-8',
  };
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex items-center -space-x-1.5">
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          className={`${sizeClass[size]} rounded-full overflow-hidden border-2 ${
            light ? 'border-white/30' : 'border-white'
          }`}
        >
          <img
            src={avatar || `https://i.pravatar.cc/100?img=${index}`}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeClass[size]} rounded-full flex items-center justify-center text-xs font-medium border-2 ${
            light
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-white dark:border-gray-800'
          }`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

// 情感化进度文案
function getEmotionalProgress(progress: number): string {
  if (progress >= 90) return '马上就要达成啦！';
  if (progress >= 80) return '再加把劲！';
  if (progress >= 50) return '已过半程';
  if (progress >= 30) return '逐渐升温';
  return '刚刚开始';
}

// 情感化消息
function getEmotionalMessage(remaining: number, progress: number, isUrgent: boolean): string {
  if (remaining === 1) return '✨ 只差你一个人就能达成了！';
  if (remaining === 2) return '🎉 还差2个人，一起来！';
  if (isUrgent && progress >= 80) return '⏰ 时间不多了，快加入吧！';
  if (progress >= 80) return `🔥 还差 ${remaining} 人，即将达成`;
  return `还差 ${remaining} 人一起，期待你的加入`;
}
