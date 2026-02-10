import { ReactNode } from 'react'
import { Icon } from './Icon'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'dream'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

const variantClasses = {
  primary: 'bg-primary text-white shadow-button',
  secondary: 'bg-primary/10 text-primary border border-primary/20',
  ghost: 'bg-transparent text-text-primary hover:bg-primary/10',
  dream: 'bg-primary text-white shadow-button',
}

const sizeClasses = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-5 text-base gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 18 : 20

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        rounded-xl font-bold flex items-center justify-center
        active:scale-[0.98] transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <Icon name={icon} size={iconSize} />}
          {children}
          {icon && iconPosition === 'right' && <Icon name={icon} size={iconSize} />}
        </>
      )}
    </button>
  )
}
