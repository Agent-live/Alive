import { useState } from 'react'

interface ImageWithStatusProps {
  src: string
  alt?: string
  className?: string
  aspectRatio?: string
  fallback?: React.ReactNode
}

export function ImageWithStatus({
  src,
  alt = '',
  className = '',
  aspectRatio = 'aspect-square',
  fallback,
}: ImageWithStatusProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  return (
    <div className={`relative overflow-hidden bg-gray-100 dark:bg-white/5 ${aspectRatio} ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 shimmer" />
      )}

      {status === 'error' && fallback ? (
        fallback
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </div>
  )
}
