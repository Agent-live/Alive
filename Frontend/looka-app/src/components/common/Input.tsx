import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Icon } from './Icon'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  icon?: string
  size?: 'sm' | 'md' | 'lg'
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const sizeClasses = {
  sm: 'h-10 px-3 text-sm',
  md: 'h-12 px-4 text-base',
  lg: 'h-14 px-5 text-base',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Icon name={icon} size={20} className="text-text-muted dark:text-text-dark-muted" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded outline-none transition-all
            surface-inset
            text-text-primary dark:text-text-dark-primary
            placeholder:text-text-muted dark:placeholder:text-text-dark-muted
            focus:border-primary focus:ring-2 focus:ring-primary/10 dark:focus:ring-primary/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${sizeClasses[size]}
            ${icon ? 'pl-12' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`
          w-full rounded px-4 py-3 outline-none transition-all resize-none
          surface-inset
          text-text-primary dark:text-text-dark-primary text-base
          placeholder:text-text-muted dark:placeholder:text-text-dark-muted
          focus:border-primary focus:ring-2 focus:ring-primary/10 dark:focus:ring-primary/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'
