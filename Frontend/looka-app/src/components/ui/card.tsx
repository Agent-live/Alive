
import * as React from 'react'
import { cn } from '@/lib/utils'
import SpotlightCard from '@/components/ui/card/SpotlightCard'

interface CardProps extends React.ComponentProps<'div'> {
  tintOpacity?: number
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`
  variant?: 'default' | 'strong' | 'thin'
  noise?: boolean
  disableBackdrop?: boolean
  disableSpotlight?: boolean  // 是否禁用聚光灯效果，默认关闭
  hoverScale?: boolean  // 是否启用 hover 缩放效果，默认关闭
}

function Card({ className, children, tintOpacity, spotlightColor, variant, noise, disableBackdrop, disableSpotlight, hoverScale, ...props }: CardProps) {
  return (
    <SpotlightCard
      className={cn(className)}
      tintOpacity={tintOpacity}
      spotlightColor={spotlightColor}
      variant={variant}
      noise={noise}
      disableBackdrop={disableBackdrop}
      disableSpotlight={disableSpotlight}
      hoverScale={hoverScale}
      {...props}
    >
      {children}
    </SpotlightCard>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'flex flex-col space-y-1.5 p-6 pb-0',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="card-title"
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('p-6 pt-4', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('flex items-center p-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
