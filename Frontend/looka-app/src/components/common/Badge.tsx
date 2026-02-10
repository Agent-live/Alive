import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'wishing' | 'making' | 'shipping' | 'owned'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

const variantClasses = {
  primary: 'bg-primary text-white',
  success: 'bg-success text-white',
  warning: 'bg-warning text-white',
  info: 'bg-info text-white',
  // 状态徽章 - 使用状态色
  wishing: 'bg-status-wishing text-white',
  making: 'bg-status-making text-white',
  shipping: 'bg-status-shipping text-white',
  owned: 'bg-status-owned text-white',
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center gap-1 font-medium rounded
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
      )}
      {children}
    </span>
  )
}
