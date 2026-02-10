import { memo } from 'react'
import { Icon, Badge } from '../common'

interface ProductCardProps {
  image: string
  title: string
  status?: 'wishing' | 'making' | 'shipping' | 'owned'
  statusText?: string
  people?: number
  isAI?: boolean
  onClick?: () => void
}

const statusLabels = {
  wishing: '等人一起',
  making: '制作中',
  shipping: '快递中',
  owned: '已拥有',
}

export const ProductCard = memo(function ProductCard({
  image,
  title,
  status,
  statusText,
  people,
  isAI,
  onClick,
}: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className="surface-card rounded overflow-hidden shadow-soft cursor-pointer active:scale-[0.98] transition-all"
    >
      <div className="relative aspect-[3/4] surface-inset">
        <img src={image} alt={title} className="w-full h-full object-cover" />

        {isAI && (
          <div className="absolute top-2 right-2 bg-black/20 dark:bg-white/20 backdrop-blur-md rounded-full p-1.5">
            <Icon name="auto_awesome" size={14} className="text-white" />
          </div>
        )}

        {status && (
          <div className="absolute bottom-2 left-2">
            <Badge variant={status} size="sm">
              {statusText || statusLabels[status]}
            </Badge>
          </div>
        )}

        {people && people > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full px-2 py-1">
            <Icon name="group" size={12} className="text-white" />
            <span className="text-xs text-white font-medium">{people}</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-base font-bold leading-snug line-clamp-2 text-text-primary dark:text-text-dark-primary">
          {title}
        </h3>
      </div>
    </div>
  )
})
