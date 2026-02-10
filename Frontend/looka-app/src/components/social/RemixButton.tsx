import { useNavigate } from 'react-router-dom';
import { DesignStats } from '@/types';
import { RefreshCw, Sparkles, FlaskConical } from 'lucide-react';

interface RemixButtonProps {
  designId: string;
  stats?: DesignStats;
  variant?: 'default' | 'compact' | 'full';
  onRemix?: () => void;
  className?: string;
}

export function RemixButton({
  designId,
  stats,
  variant = 'default',
  onRemix,
  className = '',
}: RemixButtonProps) {
  const navigate = useNavigate();

  const handleRemix = () => {
    if (onRemix) {
      onRemix();
    } else {
      navigate(`/design/editor?remix=${designId}`);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleRemix}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium hover:bg-purple-100 transition-colors ${className}`}
      >
        <RefreshCw size={14} />
        <span>Remix</span>
        {stats && stats.remixes > 0 && <span className="opacity-70">{stats.remixes}</span>}
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <button
        onClick={handleRemix}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity ${className}`}
      >
        <RefreshCw size={18} />
        <span>以此为灵感创作</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleRemix}
      className={`flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-600 font-medium hover:bg-purple-100 transition-colors ${className}`}
    >
      <RefreshCw size={18} />
      <span>Remix</span>
      {stats && stats.remixes > 0 && (
        <span className="text-purple-400 text-sm">({stats.remixes})</span>
      )}
    </button>
  );
}

// Remix 统计卡片
interface RemixStatsProps {
  stats: DesignStats;
  showAll?: boolean;
  className?: string;
}

export function RemixStats({ stats, showAll = false, className = '' }: RemixStatsProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <StatItem icon="visibility" label="浏览" value={stats.views} />
      <StatItem icon="favorite" label="喜欢" value={stats.likes} />
      <StatItem icon="repeat" label="Remix" value={stats.remixes} highlight />
      {showAll && <StatItem icon="share" label="分享" value={stats.shares} />}
    </div>
  );
}

// 统计项
function StatItem({
  icon,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`material-symbols-outlined text-base ${
          highlight ? 'text-purple-500' : 'text-gray-400'
        }`}
      >
        {icon}
      </span>
      <span className={`text-sm ${highlight ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
        {formatNumber(value)}
      </span>
    </div>
  );
}

// 原创标签
interface OriginalBadgeProps {
  isOriginal?: boolean;
  remixFrom?: {
    id: string;
    name: string;
    creator: string;
  };
  className?: string;
}

export function OriginalBadge({ isOriginal = true, remixFrom, className = '' }: OriginalBadgeProps) {
  if (isOriginal) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-medium ${className}`}
      >
        <Sparkles size={12} />
        <span>原创</span>
      </span>
    );
  }

  if (remixFrom) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs ${className}`}
      >
        <RefreshCw size={12} />
        <span>Remix 自 @{remixFrom.creator}</span>
      </span>
    );
  }

  return null;
}

// 配方公开按钮
interface RecipePublicToggleProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  className?: string;
}

export function RecipePublicToggle({ isPublic, onToggle, className = '' }: RecipePublicToggleProps) {
  return (
    <div className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl ${className}`}>
      <div className="flex items-center gap-3">
        <div
          className={`size-10 rounded-full flex items-center justify-center ${
            isPublic ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <FlaskConical size={20} className={isPublic ? 'text-purple-500' : 'text-gray-400'} />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">公开配方</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isPublic ? '其他人可以看到并 Remix 你的配方' : '仅自己可见'}
          </p>
        </div>
      </div>
      <button
        onClick={() => onToggle(!isPublic)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          isPublic ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <div
          className="absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform"
          style={{ transform: isPublic ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}
