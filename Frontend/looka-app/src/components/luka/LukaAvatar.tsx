interface LukaAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animated?: boolean
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

export function LukaAvatar({
  size = 'md',
  className = '',
  animated = false,
}: LukaAvatarProps) {
  return (
    <div
      className={`
        ${sizeClasses[size]}
        flex-shrink-0 overflow-hidden
        ${animated ? 'animate-pulse-slow' : ''}
        ${className}
      `}
    >
      <img
        src="/looka.png"
        alt="洛卡"
        className="w-full h-full object-contain"
      />
    </div>
  )
}
