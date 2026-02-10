import { DesignStatus } from '@/types';
import { Pencil, Sparkles, Scissors, Truck, Heart, LucideIcon } from 'lucide-react';

interface EmotionalBadgeProps {
  status: DesignStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// 状态配置：情感化文案和样式
const statusConfig: Record<
  DesignStatus,
  { label: string; icon: LucideIcon; bgClass: string; textClass: string }
> = {
  draft: {
    label: '草稿',
    icon: Pencil,
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
  },
  wishing: {
    label: '等你一起',
    icon: Sparkles,
    bgClass: 'bg-gradient-primary',
    textClass: 'text-white',
  },
  making: {
    label: '正在做~',
    icon: Scissors,
    bgClass: 'bg-amber-500',
    textClass: 'text-white',
  },
  shipping: {
    label: '飞奔来啦',
    icon: Truck,
    bgClass: 'bg-sky-500',
    textClass: 'text-white',
  },
  owned: {
    label: '已拥有',
    icon: Heart,
    bgClass: 'bg-emerald-500',
    textClass: 'text-white',
  },
};

// 尺寸配置
const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

// 图标尺寸配置
const iconSizeConfig = {
  sm: 10,
  md: 12,
  lg: 14,
};

export function EmotionalBadge({
  status,
  size = 'md',
  className = '',
}: EmotionalBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgClass} ${config.textClass} ${sizeClass} ${className}`}
    >
      <IconComponent size={iconSizeConfig[size]} />
      <span>{config.label}</span>
    </span>
  );
}

// 简化版本（无 emoji）
interface StatusBadgeProps {
  status: DesignStatus;
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = 'md',
  showEmoji = false,
  className = '',
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgClass} ${config.textClass} ${sizeClass} ${className}`}
    >
      {showEmoji && <IconComponent size={iconSizeConfig[size]} />}
      <span>{config.label}</span>
    </span>
  );
}

// 进度描述文案
export function getProgressDescription(
  status: DesignStatus,
  progress?: number,
  remaining?: number
): string {
  switch (status) {
    case 'draft':
      return '继续编辑你的设计';
    case 'wishing':
      if (remaining !== undefined && remaining <= 2) {
        return `还差 ${remaining} 人就能达成！`;
      }
      return progress !== undefined ? `已有 ${progress}% 的人加入` : '等待更多人加入';
    case 'making':
      return progress !== undefined ? `制作进度 ${progress}%` : '正在精心制作中';
    case 'shipping':
      return '已发货，正在飞奔而来';
    case 'owned':
      return '已加入你的衣柜';
    default:
      return '';
  }
}
