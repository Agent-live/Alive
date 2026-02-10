import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground fluent-shadow-xs hover:fluent-shadow-sm hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]',
        destructive:
          'bg-destructive text-destructive-foreground fluent-shadow-xs hover:fluent-shadow-sm hover:bg-[var(--destructive-hover)]',
        outline:
          'border border-border bg-background/60 backdrop-blur-sm fluent-shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-[var(--border-hover)]',
        secondary:
          'bg-secondary text-secondary-foreground fluent-shadow-xs hover:fluent-shadow-sm hover:bg-[var(--secondary-hover)]',
        ghost:
          'hover:bg-accent/80 hover:text-accent-foreground',
        link:
          'text-primary underline-offset-4 hover:underline',
        // Fluent Design 新增变体
        subtle:
          'bg-muted hover:bg-muted-hover text-muted-foreground border border-border',
        acrylic:
          'bg-[var(--acrylic-base)] backdrop-blur-[20px] saturate-[180%] border border-[var(--card-border)] fluent-shadow-xs hover:fluent-shadow-sm hover:bg-[var(--elevated-hover)]',
        toggle:
          'bg-muted hover:bg-muted-hover text-muted-foreground data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/20 border border-transparent data-[state=on]:border',
        sidebar:
          'w-full justify-start gap-3 px-3 py-2.5 rounded text-sidebar-foreground hover:bg-sidebar-accent',
        // 颜色选择器专用变体
        'color-swatch':
          'relative border-2 border-transparent hover:scale-110 active:scale-95 data-[state=on]:border-foreground data-[state=on]:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
