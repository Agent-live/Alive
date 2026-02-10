interface IconProps {
  name: string
  className?: string
  size?: number
  filled?: boolean
  weight?: number
}

export function Icon({
  name,
  className = '',
  size = 24,
  filled = false,
  weight,
}: IconProps) {
  const fillClass = filled ? 'filled' : ''

  // Custom weight via inline style
  const style: React.CSSProperties = {
    fontSize: size,
    ...(weight && {
      fontVariationSettings: `'wght' ${weight}, 'opsz' 24, 'FILL' ${filled ? 1 : 0}`,
    }),
  }

  return (
    <span
      className={`material-symbols-outlined ${fillClass} ${className}`}
      style={style}
    >
      {name}
    </span>
  )
}
