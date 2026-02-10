
import * as React from 'react'
import { Button as FluentButton, makeStyles, shorthands, type ButtonProps } from '@fluentui/react-components'
import { cn } from '@/lib/utils'

// Fluent UI Reveal 效果样式
const useRevealButtonStyles = makeStyles({
  root: {
    position: 'relative',
    overflow: 'hidden',
    ...shorthands.borderRadius('8px'),
    ...shorthands.transition('all', '167ms', 'cubic-bezier(0.2, 0, 0, 1)'),

    // 基础样式
    backgroundColor: 'rgba(252, 252, 253, 0.6)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.1)'),
    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',

    // Reveal 悬停效果
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.12)',
      ...shorthands.borderColor('rgba(255, 255, 255, 0.2)'),
      backgroundColor: 'rgba(252, 252, 253, 0.8)',
    },

    // 按下效果
    ':active': {
      transform: 'scale(0.98)',
      transitionDuration: '67ms',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },

    // 聚焦效果
    ':focus-visible': {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineColor: 'var(--colorBrandBackground)',
      outlineOffset: '2px',
    },
  },

  // Primary 变体
  primary: {
    backgroundColor: 'var(--colorBrandBackground)',
    color: 'var(--colorNeutralForegroundOnBrand)',
    ...shorthands.border('1px', 'solid', 'transparent'),

    ':hover': {
      backgroundColor: 'var(--colorBrandBackgroundHover)',
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 12px 0 rgba(84, 50, 168, 0.3)',
    },

    ':active': {
      backgroundColor: 'var(--colorBrandBackgroundPressed)',
      transform: 'scale(0.98)',
    },
  },

  // Reveal 光晕效果层
  revealGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '0',
    height: '0',
    ...shorthands.borderRadius('50%'),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: 'translate(-50%, -50%)',
    ...shorthands.transition('width', '600ms', 'ease-out'),
    transitionProperty: 'width, height',
    pointerEvents: 'none',
  },
})

export interface RevealButtonProps extends Omit<ButtonProps, 'appearance'> {
  variant?: 'default' | 'primary' | 'subtle'
}

export function RevealButton({
  className,
  variant = 'default',
  children,
  onMouseMove: externalOnMouseMove,
  ...props
}: RevealButtonProps) {
  const styles = useRevealButtonStyles()
  const [glowPosition, setGlowPosition] = React.useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = React.useState(false)

  // Handle mouse move for reveal effect
  const handleMouseMove: React.MouseEventHandler<HTMLElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setGlowPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    // Forward to external handler if provided
    if (externalOnMouseMove) {
      (externalOnMouseMove as React.MouseEventHandler<HTMLElement>)(e)
    }
  }

  // Separate handlers to avoid type conflicts
  const buttonProps = {
    ...props,
    className: cn(
      styles.root,
      variant === 'primary' && styles.primary,
      className
    ),
    onMouseEnter: () => setIsHovering(true),
    onMouseLeave: () => setIsHovering(false),
  }

  // FluentUI Button supports both button and anchor elements, causing complex type inference
  // Use explicit props object with type assertion to resolve the union type conflict
  const allProps = {
    ...buttonProps,
    onMouseMove: handleMouseMove,
  }

  return (
    // @ts-expect-error FluentUI ButtonProps has complex union types for button/anchor elements
    <FluentButton {...allProps}>
      {/* Reveal 光晕效果 */}
      {isHovering && (
        <span
          className={styles.revealGlow}
          style={{
            left: `${glowPosition.x}px`,
            top: `${glowPosition.y}px`,
            width: '100px',
            height: '100px',
          }}
        />
      )}

      {/* 按钮内容 */}
      <span style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </span>
    </FluentButton>
  )
}
