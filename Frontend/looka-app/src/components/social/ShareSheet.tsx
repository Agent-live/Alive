import { useState } from 'react';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  image?: string;
  url?: string;
  onShare?: (platform: SharePlatform) => void;
}

export type SharePlatform = 'wechat' | 'moments' | 'weibo' | 'qq' | 'copy' | 'more';

interface ShareOption {
  id: SharePlatform;
  name: string;
  icon: string;
  color: string;
}

const shareOptions: ShareOption[] = [
  { id: 'wechat', name: '微信', icon: '💬', color: 'bg-emerald-500' },
  { id: 'moments', name: '朋友圈', icon: '🌐', color: 'bg-emerald-600' },
  { id: 'weibo', name: '微博', icon: '📱', color: 'bg-red-500' },
  { id: 'qq', name: 'QQ', icon: '🐧', color: 'bg-sky-500' },
  { id: 'copy', name: '复制链接', icon: '🔗', color: 'bg-gray-500' },
  { id: 'more', name: '更多', icon: '•••', color: 'bg-gray-400' },
];

export function ShareSheet({
  isOpen,
  onClose,
  title,
  description,
  image,
  onShare,
}: ShareSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = (platform: SharePlatform) => {
    if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    onShare?.(platform);
    if (platform !== 'copy') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* 面板 */}
      <div className="fixed bottom-0 left-0 right-0 share-sheet max-w-md mx-auto animate-slide-up">
        {/* 拖动指示器 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-black/10 rounded-full" />
        </div>

        {/* 预览卡片 */}
        <div className="mx-4 p-3 surface-muted rounded-xl flex gap-3">
          {image && (
            <div className="size-16 rounded-lg overflow-hidden flex-shrink-0">
              <img src={image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 line-clamp-2">{title}</h3>
            {description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>
            )}
          </div>
        </div>

        {/* 分享选项 */}
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-3">分享到</p>
          <div className="grid grid-cols-4 gap-4">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleShare(option.id)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`size-12 rounded-full ${option.color} flex items-center justify-center text-xl`}
                >
                  {option.icon}
                </div>
                <span className="text-xs text-gray-600">
                  {option.id === 'copy' && copied ? '已复制' : option.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 取消按钮 */}
        <div className="p-4 pt-0 pb-safe">
          <button
            onClick={onClose}
            className="w-full py-3 surface-inset rounded-xl text-gray-600 font-medium"
          >
            取消
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .pb-safe {
          padding-bottom: max(16px, env(safe-area-inset-bottom));
        }
      `}</style>
    </>
  );
}

// 分享按钮组件
interface ShareButtonProps {
  onClick: () => void;
  variant?: 'icon' | 'text' | 'full';
  className?: string;
}

export function ShareButton({ onClick, variant = 'icon', className = '' }: ShareButtonProps) {
  if (variant === 'icon') {
    return (
      <button
        onClick={onClick}
        className={`size-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ${className}`}
      >
        <span className="material-symbols-outlined text-gray-600">share</span>
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1 text-gray-500 hover:text-gray-700 ${className}`}
      >
        <span className="material-symbols-outlined text-lg">share</span>
        <span className="text-sm">分享</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition-colors ${className}`}
    >
      <span className="material-symbols-outlined text-lg">share</span>
      <span className="text-sm font-medium">分享给朋友</span>
    </button>
  );
}

// 快速分享栏
interface QuickShareBarProps {
  onShare: (platform: SharePlatform) => void;
  className?: string;
}

export function QuickShareBar({ onShare, className = '' }: QuickShareBarProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-xs text-gray-400">分享：</span>
      <button
        onClick={() => onShare('wechat')}
        className="size-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm"
      >
        💬
      </button>
      <button
        onClick={() => onShare('moments')}
        className="size-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm"
      >
        🌐
      </button>
      <button
        onClick={() => onShare('copy')}
        className="size-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm"
      >
        🔗
      </button>
    </div>
  );
}
