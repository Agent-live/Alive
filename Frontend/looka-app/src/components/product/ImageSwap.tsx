import { useState, memo } from 'react'

interface ImageSwapProps {
  mainImage: string
  thumbImage: string
  alt?: string
  className?: string
  thumbSize?: 'sm' | 'md' | 'lg'
}

const thumbSizeClasses = {
  sm: 'w-6 h-7',
  md: 'w-9 h-11',
  lg: 'w-14 h-18',
}

const thumbPositionClasses = {
  sm: 'bottom-1.5 left-1.5',
  md: 'bottom-1.5 left-1.5',
  lg: 'bottom-3 left-3',
}

export const ImageSwap = memo(function ImageSwap({
  mainImage,
  thumbImage,
  alt = '',
  className = '',
  thumbSize = 'md',
}: ImageSwapProps) {
  const [isSwapped, setIsSwapped] = useState(false)

  const currentMain = isSwapped ? thumbImage : mainImage
  const currentThumb = isSwapped ? mainImage : thumbImage

  return (
    <div className={`relative bg-gray-100 ${className}`}>
      {/* 主图 */}
      <img
        src={currentMain}
        alt={alt}
        className="w-full h-full object-cover"
      />
      {/* 左下角缩略图 - 可点击切换 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsSwapped(!isSwapped)
        }}
        className={`absolute ${thumbPositionClasses[thumbSize]} ${thumbSizeClasses[thumbSize]} rounded overflow-hidden border-2 border-white shadow-lg bg-white active:scale-95 transition-transform`}
      >
        <img
          src={currentThumb}
          alt=""
          className="w-full h-full object-cover"
        />
      </button>
    </div>
  )
})
