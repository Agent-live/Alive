import { ReactNode } from 'react'

/**
 * 骨架块组件
 */
interface SkeletonBlockProps {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

const roundedClasses = {
  sm: 'rounded-sm',
  md: 'rounded',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export function SkeletonBlock({ className = '', rounded = 'md' }: SkeletonBlockProps) {
  return (
    <div className={`shimmer ${roundedClasses[rounded]} ${className}`} />
  )
}

/**
 * 骨架文本行
 */
interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 1, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

/**
 * 骨架头像
 */
interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const avatarSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

export function SkeletonAvatar({ size = 'md', className = '' }: SkeletonAvatarProps) {
  return (
    <SkeletonBlock
      className={`${avatarSizes[size]} ${className}`}
      rounded="full"
    />
  )
}

/**
 * 骨架卡片
 */
interface SkeletonCardProps {
  showImage?: boolean
  showAvatar?: boolean
  lines?: number
  className?: string
}

export function SkeletonCard({
  showImage = true,
  showAvatar = false,
  lines = 2,
  className = '',
}: SkeletonCardProps) {
  return (
    <div className={`bg-white rounded-lg overflow-hidden ${className}`}>
      {showImage && (
        <SkeletonBlock className="w-full aspect-[4/5]" rounded="sm" />
      )}
      <div className="p-3 space-y-2">
        {showAvatar && (
          <div className="flex items-center gap-2">
            <SkeletonAvatar size="sm" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        )}
        <SkeletonText lines={lines} />
      </div>
    </div>
  )
}

/**
 * 页面骨架屏类型
 */
type PageSkeletonType =
  | 'list'        // 列表页
  | 'grid'        // 网格页（瀑布流）
  | 'detail'      // 详情页
  | 'profile'     // 个人中心
  | 'checkout'    // 结账页
  | 'chat'        // 聊天页
  | 'form'        // 表单页

/**
 * PageSkeleton 组件属性
 */
interface PageSkeletonProps {
  /** 骨架屏类型 */
  type?: PageSkeletonType
  /** 列表/网格项数量 */
  count?: number
  /** 是否显示头部 */
  showHeader?: boolean
  /** 自定义内容 */
  children?: ReactNode
  /** 自定义类名 */
  className?: string
}

/**
 * PageSkeleton - 统一的页面骨架屏组件
 *
 * 设计规范：
 * - 使用 shimmer 动画效果
 * - 保持与实际页面相似的布局
 * - 统一的骨架块样式和间距
 *
 * @example
 * ```tsx
 * // 网格页骨架屏
 * <PageSkeleton type="grid" count={6} />
 *
 * // 详情页骨架屏
 * <PageSkeleton type="detail" showHeader />
 *
 * // 自定义骨架屏
 * <PageSkeleton>
 *   <SkeletonCard />
 *   <SkeletonText lines={3} />
 * </PageSkeleton>
 * ```
 */
export function PageSkeleton({
  type = 'list',
  count = 4,
  showHeader = false,
  children,
  className = '',
}: PageSkeletonProps) {
  // 自定义内容
  if (children) {
    return (
      <div className={`animate-pulse ${className}`}>
        {showHeader && <HeaderSkeleton />}
        {children}
      </div>
    )
  }

  // 预设类型
  return (
    <div className={`animate-pulse ${className}`}>
      {showHeader && <HeaderSkeleton />}
      {renderSkeleton(type, count)}
    </div>
  )
}

/**
 * 头部骨架屏
 */
function HeaderSkeleton() {
  return (
    <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4">
      <SkeletonBlock className="w-10 h-10" rounded="full" />
      <SkeletonBlock className="w-24 h-5" />
      <SkeletonBlock className="w-10 h-10" rounded="full" />
    </div>
  )
}

/**
 * 根据类型渲染骨架屏
 */
function renderSkeleton(type: PageSkeletonType, count: number) {
  switch (type) {
    case 'grid':
      return <GridSkeleton count={count} />
    case 'list':
      return <ListSkeleton count={count} />
    case 'detail':
      return <DetailSkeleton />
    case 'profile':
      return <ProfileSkeleton />
    case 'checkout':
      return <CheckoutSkeleton />
    case 'chat':
      return <ChatSkeleton count={count} />
    case 'form':
      return <FormSkeleton />
    default:
      return <ListSkeleton count={count} />
  }
}

/**
 * 网格骨架屏（瀑布流）
 */
function GridSkeleton({ count }: { count: number }) {
  const aspectRatios = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[3/5]', 'aspect-square']

  return (
    <div className="p-2">
      <div className="grid grid-cols-2 gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded overflow-hidden">
            <SkeletonBlock
              className={`w-full ${aspectRatios[i % aspectRatios.length]}`}
              rounded="sm"
            />
            <div className="p-2 space-y-2">
              <SkeletonBlock className="h-4 w-full" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <SkeletonAvatar size="sm" />
                  <SkeletonBlock className="h-3 w-12" />
                </div>
                <SkeletonBlock className="h-3 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 列表骨架屏
 */
function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-3 flex gap-3">
          <SkeletonBlock className="w-20 h-20 flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-3 w-1/2" />
            <div className="flex items-center justify-between mt-auto">
              <SkeletonBlock className="h-4 w-16" />
              <SkeletonBlock className="h-6 w-16" rounded="full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 详情页骨架屏
 */
function DetailSkeleton() {
  return (
    <div className="pb-24">
      {/* 大图 */}
      <SkeletonBlock className="w-full aspect-square" rounded="sm" />

      <div className="p-4 space-y-4">
        {/* 标题和价格 */}
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-3/4" />
          <SkeletonBlock className="h-8 w-1/3" />
        </div>

        {/* 设计师信息 */}
        <div className="flex items-center gap-3 py-3 border-y border-gray-100">
          <SkeletonAvatar size="lg" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        </div>

        {/* 描述 */}
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>

        {/* 规格选择 */}
        <div className="space-y-3 pt-4">
          <SkeletonBlock className="h-5 w-16" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBlock key={i} className="h-8 w-12" rounded="full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 个人中心骨架屏
 */
function ProfileSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* 头像和用户名 */}
      <div className="flex items-center gap-4 py-4">
        <SkeletonBlock className="w-20 h-20" rounded="full" />
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-24" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-3 gap-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-1">
            <SkeletonBlock className="h-6 w-12 mx-auto" />
            <SkeletonBlock className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* 菜单项 */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 flex items-center gap-3">
            <SkeletonBlock className="w-6 h-6" rounded="full" />
            <SkeletonBlock className="h-4 flex-1" />
            <SkeletonBlock className="w-6 h-6" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 结账页骨架屏
 */
function CheckoutSkeleton() {
  return (
    <div className="p-4 space-y-4 pb-32">
      {/* 地址 */}
      <div className="bg-white rounded-xl p-4">
        <div className="flex items-start gap-3">
          <SkeletonBlock className="w-6 h-6 mt-0.5" rounded="full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-4 w-16" />
              <SkeletonBlock className="h-4 w-24" />
            </div>
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-3/4" />
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <SkeletonBlock className="h-4 w-20" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 p-4 border-b border-gray-100 last:border-0">
            <SkeletonBlock className="w-20 h-20 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-3 w-20" />
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-4 w-16" />
                <SkeletonBlock className="h-4 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 价格明细 */}
      <div className="bg-white rounded-xl p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 聊天页骨架屏
 */
function ChatSkeleton({ count }: { count: number }) {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          {i % 2 === 0 && <SkeletonAvatar size="sm" className="mr-2" />}
          <SkeletonBlock
            className={`h-12 ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`}
            rounded="lg"
          />
        </div>
      ))}
    </div>
  )
}

/**
 * 表单页骨架屏
 */
function FormSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      ))}
      <SkeletonBlock className="h-12 w-full mt-6" rounded="lg" />
    </div>
  )
}

export default PageSkeleton
