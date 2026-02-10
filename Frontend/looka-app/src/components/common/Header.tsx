import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

interface HeaderProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  transparent?: boolean
  dark?: boolean
  className?: string
}

export function Header({
  title,
  showBack = false,
  onBack,
  leftAction,
  rightAction,
  transparent = false,
  dark = false,
  className = '',
}: HeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  const textColor = dark ? 'text-white' : 'text-text-primary dark:text-gray-100'
  const iconColor = dark ? 'text-white/70' : 'text-gray-600 dark:text-gray-400'

  return (
    <header
      className={`
        sticky top-0 z-50 transition-all
        ${transparent
          ? 'bg-transparent border-transparent'
          : dark
            ? 'bg-gray-900 border-b border-white/10'
            : 'bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/10'
        }
        ${className}
      `}
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <div className="flex items-center h-14 px-4 justify-between max-w-md mx-auto">
        <div className="flex w-10 items-center justify-start">
          {leftAction || (showBack && (
            <button
              onClick={handleBack}
              className="size-10 flex items-center justify-center -ml-2"
            >
              <Icon name="arrow_back_ios" size={20} className={iconColor} />
            </button>
          ))}
        </div>

        {title && (
          <h1 className={`text-md font-bold tracking-tight flex-1 text-center ${textColor}`}>
            {title}
          </h1>
        )}

        <div className="flex w-10 items-center justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  )
}
