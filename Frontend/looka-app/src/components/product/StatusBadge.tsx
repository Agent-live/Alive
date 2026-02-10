import { Badge } from '../common'

type Status = 'wishing' | 'making' | 'shipping' | 'owned'

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md'
  showDot?: boolean
  className?: string
}

const statusConfig: Record<Status, { label: string; icon?: string }> = {
  wishing: { label: '许愿中' },
  making: { label: '制作中' },
  shipping: { label: '快递中' },
  owned: { label: '已拥有' },
}

export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  className = '',
}: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant={status}
      size={size}
      dot={showDot}
      className={className}
    >
      {config.label}
    </Badge>
  )
}
