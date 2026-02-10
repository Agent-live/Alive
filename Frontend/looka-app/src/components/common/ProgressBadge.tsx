import { ReactNode } from 'react'

/**
 * ProgressBadge 变体类型
 */
type ProgressVariant = 'default' | 'urgent' | 'success' | 'warning'

/**
 * ProgressBadge 组件属性
 */
interface ProgressBadgeProps {
  /** 当前人数 */
  current: number
  /** 目标人数 */
  target: number
  /** 显示模式 */
  mode?: 'remaining' | 'progress' | 'fraction'
  /** 尺寸 */
  size?: 'sm' | 'md'
  /** 是否显示图标 */
  showIcon?: boolean
  /** 自定义前缀文本 */
  prefix?: string
  /** 自定义后缀文本 */
  suffix?: string
  /** 自定义类名 */
  className?: string
  /** 自定义内容 */
  children?: ReactNode
}

/**
 * 根据进度计算变体
 */
function getVariant(current: number, target: number): ProgressVariant {
  const progress = (current / target) * 100
  const remaining = target - current

  if (remaining === 0) return 'success'
  if (remaining <= 3) return 'urgent'
  if (progress >= 80) return 'warning'
  return 'default'
}

/**
 * 变体样式配置
 */
const variantStyles: Record<ProgressVariant, string> = {
  default: 'bg-primary/10 text-primary',
  urgent: 'bg-error/10 text-error',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
}

/**
 * 尺寸样式配置
 */
const sizeStyles = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
}

/**
 * ProgressBadge - 真实进度标签组件
 *
 * 替换误导性的"快了"标签，显示真实的剩余人数信息。
 *
 * 设计规范：
 * - 根据剩余人数动态改变颜色
 *   - 还差 1-3 人：红色（紧迫）
 *   - 还差 4-20% 人：橙色（即将）
 *   - 其他：主题色（默认）
 *   - 已满：绿色（成功）
 * - 显示真实数字而非模糊的"快了"
 *
 * @example
 * ```tsx
 * // 显示"还差 5 人"
 * <ProgressBadge current={95} target={100} />
 *
 * // 显示"95/100"
 * <ProgressBadge current={95} target={100} mode="fraction" />
 *
 * // 显示"95%"
 * <ProgressBadge current={95} target={100} mode="progress" />
 * ```
 */
export function ProgressBadge({
  current,
  target,
  mode = 'remaining',
  size = 'sm',
  showIcon = false,
  prefix,
  suffix,
  className = '',
  children,
}: ProgressBadgeProps) {
  const remaining = Math.max(0, target - current)
  const progress = Math.min(100, Math.round((current / target) * 100))
  const variant = getVariant(current, target)

  // 生成显示文本
  const getText = () => {
    if (children) return children

    switch (mode) {
      case 'remaining':
        if (remaining === 0) return '已成团'
        return `${prefix || '还差 '}${remaining}${suffix || ' 人'}`
      case 'progress':
        return `${progress}%`
      case 'fraction':
        return `${current}/${target}`
      default:
        return `还差 ${remaining} 人`
    }
  }

  // 获取图标
  const getIcon = () => {
    if (!showIcon) return null

    switch (variant) {
      case 'urgent':
        return '🔥'
      case 'success':
        return '✅'
      case 'warning':
        return '⏰'
      default:
        return '👥'
    }
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {showIcon && <span className="text-xs">{getIcon()}</span>}
      {getText()}
    </span>
  )
}

/**
 * ProgressBar - 进度条组件
 *
 * 配合 ProgressBadge 使用的进度条
 */
interface ProgressBarProps {
  /** 当前人数 */
  current: number
  /** 目标人数 */
  target: number
  /** 高度 */
  height?: 'sm' | 'md'
  /** 是否显示动画 */
  animated?: boolean
  /** 自定义类名 */
  className?: string
}

const heightStyles = {
  sm: 'h-1',
  md: 'h-1.5',
}

export function ProgressBar({
  current,
  target,
  height = 'sm',
  animated = true,
  className = '',
}: ProgressBarProps) {
  const progress = Math.min(100, Math.round((current / target) * 100))
  const variant = getVariant(current, target)

  const barColors: Record<ProgressVariant, string> = {
    default: 'bg-primary',
    urgent: 'bg-error',
    success: 'bg-success',
    warning: 'bg-warning',
  }

  return (
    <div className={`bg-gray-100 rounded-full overflow-hidden ${heightStyles[height]} ${className}`}>
      <div
        className={`
          h-full rounded-full
          ${barColors[variant]}
          ${animated ? 'transition-all duration-500' : ''}
        `}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

/**
 * ProgressInfo - 组合进度信息组件
 *
 * 包含进度条和标签的完整进度展示
 */
interface ProgressInfoProps {
  /** 当前人数 */
  current: number
  /** 目标人数 */
  target: number
  /** 剩余时间（秒） */
  remainingTime?: number
  /** 是否显示时间 */
  showTime?: boolean
  /** 自定义类名 */
  className?: string
}

export function ProgressInfo({
  current,
  target,
  remainingTime,
  showTime = true,
  className = '',
}: ProgressInfoProps) {
  // 格式化剩余时间
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '已结束'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    if (days > 0) return `${days}天`
    if (hours > 0) return `${hours}小时`
    const mins = Math.floor(seconds / 60)
    return `${mins}分钟`
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* 顶部信息行 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          <span className="text-primary font-bold">{current}</span>
          /{target} 人
        </span>
        {showTime && remainingTime !== undefined && (
          <span className="text-gray-400">
            {formatTime(remainingTime)}
          </span>
        )}
      </div>

      {/* 进度条 */}
      <ProgressBar current={current} target={target} />

      {/* 底部标签（可选） */}
      {target - current <= 10 && target - current > 0 && (
        <div className="flex justify-end">
          <ProgressBadge
            current={current}
            target={target}
            size="sm"
            showIcon
          />
        </div>
      )}
    </div>
  )
}
