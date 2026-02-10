import { useState } from 'react';
import { WishStatus } from '@/types';

interface JoinWishButtonProps {
  wishId: string;
  status: WishStatus;
  hasJoined: boolean;
  price: number;
  originalPrice: number;
  remaining: number;
  onJoin: () => void;
  className?: string;
}

export function JoinWishButton({
  status,
  hasJoined,
  price,
  originalPrice,
  remaining,
  onJoin,
  className = '',
}: JoinWishButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (hasJoined || status !== 'active') return;

    setIsAnimating(true);
    onJoin();
    setTimeout(() => setIsAnimating(false), 600);
  };

  // 已加入状态
  if (hasJoined) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between bg-primary/5 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-sm font-medium text-gray-900">你已经加入</p>
              <p className="text-xs text-gray-500">等待更多人一起达成愿望</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-full bg-gray-100 text-gray-500 text-sm">
            邀请好友
          </button>
        </div>
      </div>
    );
  }

  // 愿望已成功
  if (status === 'success') {
    return (
      <div className={`${className}`}>
        <div className="text-center py-4 bg-emerald-50 rounded-xl">
          <span className="text-3xl">🎉</span>
          <p className="text-emerald-600 font-bold mt-2">愿望已达成！</p>
          <p className="text-sm text-gray-500 mt-1">正在准备生产</p>
        </div>
      </div>
    );
  }

  // 愿望已失败/过期
  if (status === 'failed' || status === 'expired') {
    return (
      <div className={`${className}`}>
        <div className="text-center py-4 bg-gray-50 rounded-xl">
          <span className="text-3xl">😔</span>
          <p className="text-gray-500 font-medium mt-2">很遗憾，这个愿望没有达成</p>
          <button className="mt-3 px-4 py-2 rounded-full bg-primary text-white text-sm">
            发起新的愿望
          </button>
        </div>
      </div>
    );
  }

  // 可加入状态
  return (
    <div className={`${className}`}>
      {/* 价格信息 */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <span className="text-2xl font-bold text-primary">¥{price}</span>
          <span className="text-sm text-gray-400 line-through ml-2">¥{originalPrice}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500">
            还差 <span className="text-primary font-bold">{remaining}</span> 人
          </span>
        </div>
      </div>

      {/* 加入按钮 */}
      <button
        onClick={handleClick}
        className={`w-full py-4 rounded-xl font-bold text-white text-lg relative overflow-hidden transition-transform bg-gradient-primary shadow-button ${
          isAnimating ? 'scale-95' : 'active:scale-95'
        }`}
      >
        {/* 闪光效果 */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full ${
            isAnimating ? 'animate-shimmer' : ''
          }`}
          style={{
            animation: isAnimating ? 'shimmer 0.6s ease' : 'none',
          }}
        />
        <span className="relative z-10 flex items-center justify-center gap-2">
          <span>✨</span>
          <span>{remaining === 1 ? '成为达成愿望的最后一人' : '一起许愿'}</span>
        </span>
      </button>

      {/* 提示信息 */}
      <p className="text-center text-xs text-gray-400 mt-2">
        {remaining <= 3 ? '快要达成了，加入后锁定优惠价格' : '加入后，邀请好友一起达成'}
      </p>

      {/* 信任标签 */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <TrustBadge icon="verified_user" text="正品保障" />
        <TrustBadge icon="local_shipping" text="品质定制" />
        <TrustBadge icon="replay" text="不达成退款" />
      </div>
    </div>
  );
}

// 信任标签
function TrustBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-1 text-gray-400">
      <span className="material-symbols-outlined text-sm">{icon}</span>
      <span className="text-xs">{text}</span>
    </div>
  );
}

// 快速加入按钮（用于列表卡片）
interface QuickJoinButtonProps {
  remaining: number;
  hasJoined: boolean;
  onJoin: () => void;
  size?: 'sm' | 'md';
}

export function QuickJoinButton({
  remaining,
  hasJoined,
  onJoin,
  size = 'sm',
}: QuickJoinButtonProps) {
  if (hasJoined) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-600 ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        }`}
      >
        <span>✓</span>
        <span>已加入</span>
      </span>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onJoin();
      }}
      className={`inline-flex items-center gap-1 rounded-full bg-primary text-white font-medium active:scale-95 transition-transform ${
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-1.5 text-sm'
      }`}
    >
      <span>+</span>
      <span>{remaining === 1 ? '最后1人' : '加入'}</span>
    </button>
  );
}
