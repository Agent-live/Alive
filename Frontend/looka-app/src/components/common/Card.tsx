import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'outlined' | 'dream'
  interactive?: boolean
  onClick?: () => void
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

const variantClasses = {
  default: 'surface-card shadow-soft',
  elevated: 'surface-card shadow-card',
  outlined: 'bg-transparent border border-black/[0.08] dark:border-white/[0.12]',
  dream: 'bg-gradient-dream-soft dark:bg-gradient-dream-dark border border-primary/10 dark:border-primary/20',
}

export function Card({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  interactive = false,
  onClick,
}: CardProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      className={`
        rounded-xl transition-all duration-200
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${interactive || onClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-card dark:hover:shadow-lg' : ''}
        ${onClick ? 'text-left w-full' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </Component>
  )
}
