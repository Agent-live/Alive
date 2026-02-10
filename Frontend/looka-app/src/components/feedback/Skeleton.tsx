interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'shimmer' | 'pulse' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer',
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  const animationClasses = {
    shimmer: 'shimmer',
    pulse: 'animate-pulse bg-gray-200 dark:bg-gray-700',
    none: 'bg-gray-200 dark:bg-gray-700',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={style}
    />
  );
}

// 商品卡片骨架屏
export function ProductCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-card-1 w-full" />
      <Skeleton className="h-4 w-3/4" variant="text" />
      <Skeleton className="h-4 w-1/2" variant="text" />
    </div>
  );
}

// 商品列表骨架屏
export function ProductListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

// 订单卡片骨架屏
export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" variant="text" />
        <Skeleton className="h-4 w-16" variant="text" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="w-20 h-20 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" variant="text" />
          <Skeleton className="h-4 w-2/3" variant="text" />
        </div>
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <Skeleton className="h-4 w-24" variant="text" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

// 订单列表骨架屏
export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <OrderCardSkeleton key={index} />
      ))}
    </div>
  );
}

// 拼团卡片骨架屏
export function GroupBuyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" variant="text" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" variant="text" />
          <Skeleton className="h-4 w-12" variant="text" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
        </div>
      </div>
    </div>
  );
}

// 拼团列表骨架屏
export function GroupBuyListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <GroupBuyCardSkeleton key={index} />
      ))}
    </div>
  );
}

// 地址卡片骨架屏
export function AddressCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16" variant="text" />
        <Skeleton className="h-5 w-24" variant="text" />
      </div>
      <Skeleton className="h-4 w-full" variant="text" />
      <Skeleton className="h-4 w-2/3" variant="text" />
    </div>
  );
}

// 个人资料骨架屏
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* 头像区域 */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16" variant="circular" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" variant="text" />
          <Skeleton className="h-4 w-32" variant="text" />
        </div>
      </div>
      {/* 统计数据 */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="text-center space-y-1">
            <Skeleton className="h-6 w-12 mx-auto" variant="text" />
            <Skeleton className="h-4 w-8 mx-auto" variant="text" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 通用列表项骨架屏
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-32" variant="text" />
        <Skeleton className="h-3 w-24" variant="text" />
      </div>
      <Skeleton className="w-6 h-6 rounded" />
    </div>
  );
}

// 愿望详情骨架屏
export function WishDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* 头图 */}
      <Skeleton className="aspect-square w-full" animation="shimmer" />

      {/* 进度条区域 */}
      <div className="px-4 py-4 bg-gray-50">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-4 w-32" variant="text" />
          <Skeleton className="h-4 w-12" variant="text" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Tab */}
      <div className="flex justify-center gap-8 py-3 border-b border-gray-100">
        <Skeleton className="h-4 w-12" variant="text" />
        <Skeleton className="h-4 w-12" variant="text" />
        <Skeleton className="h-4 w-12" variant="text" />
      </div>

      {/* 内容 */}
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" variant="text" />
          <Skeleton className="h-4 w-1/2" variant="text" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      {/* 底部按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}

// 生产预览骨架屏
export function ProductionPreviewSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header 占位 */}
      <div className="h-14" />

      {/* Tab */}
      <div className="flex justify-center gap-8 py-3 bg-white border-b border-gray-100">
        <Skeleton className="h-4 w-16" variant="text" />
        <Skeleton className="h-4 w-12" variant="text" />
        <Skeleton className="h-4 w-12" variant="text" />
      </div>

      {/* 内容 */}
      <div className="px-4 py-4 space-y-4">
        {/* 设计图 */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex gap-2">
            <Skeleton className="aspect-square w-1/3 rounded-lg" />
            <Skeleton className="aspect-square w-1/3 rounded-lg" />
            <Skeleton className="aspect-square w-1/3 rounded-lg" />
          </div>
        </div>

        {/* 规格 */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <Skeleton className="h-5 w-20" variant="text" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-12" variant="text" />
                <Skeleton className="h-4 w-16" variant="text" />
              </div>
            ))}
          </div>
        </div>

        {/* 工艺 */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <Skeleton className="h-5 w-20" variant="text" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" variant="text" />
                <Skeleton className="h-3 w-40" variant="text" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 配方详情骨架屏
export function RecipeDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header 占位 */}
      <div className="h-14" />

      {/* 图片 */}
      <div className="px-2 pt-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
      </div>

      {/* 标题 */}
      <div className="px-4 pt-4 space-y-3">
        <Skeleton className="h-6 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />

        {/* 创作者 */}
        <div className="flex items-center gap-3 py-3 border-t border-gray-100">
          <Skeleton className="w-10 h-10" variant="circular" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" variant="text" />
            <Skeleton className="h-3 w-32" variant="text" />
          </div>
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>

        {/* 统计 */}
        <div className="flex gap-6 py-3 border-t border-gray-100">
          <Skeleton className="h-4 w-16" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
        </div>
      </div>

      {/* 配方卡片 */}
      <div className="px-2 pt-4">
        <Skeleton className="h-5 w-20 mb-2 mx-2" variant="text" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>

      {/* 底部按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

// 衣柜骨架屏
export function ClosetSkeleton() {
  return (
    <div className="space-y-4">
      {/* 洛卡 推荐卡片 */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-8 h-8" variant="circular" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" variant="text" />
            <Skeleton className="h-4 w-32" variant="text" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="flex-1 aspect-square rounded" />
          <Skeleton className="flex-1 aspect-square rounded" />
          <Skeleton className="flex-1 aspect-square rounded" />
        </div>
      </div>

      {/* 分类标签 */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-12 rounded-full" />
        ))}
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-2 gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className={`w-full ${i % 2 === 0 ? 'aspect-[3/4]' : 'aspect-square'} rounded`} />
            <Skeleton className="h-4 w-3/4" variant="text" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 个人主页内容骨架屏
export function ProfileContentSkeleton() {
  return (
    <div className="space-y-4">
      {/* 身材档案卡片 */}
      <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10" variant="circular" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-20" variant="text" />
          <Skeleton className="h-3 w-32" variant="text" />
        </div>
        <Skeleton className="w-5 h-5" />
      </div>

      {/* Tab */}
      <div className="flex justify-center gap-8 border-b border-gray-100 pb-3">
        <Skeleton className="h-4 w-16" variant="text" />
        <Skeleton className="h-4 w-12" variant="text" />
        <Skeleton className="h-4 w-12" variant="text" />
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-2 gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded overflow-hidden border border-gray-100">
            <Skeleton className={`w-full ${i % 2 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`} />
            <div className="p-2.5 space-y-2">
              <Skeleton className="h-4 w-3/4" variant="text" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-4 h-4" variant="circular" />
                <Skeleton className="h-3 w-16" variant="text" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 愿望卡片（横向）骨架屏
export function WishCardHorizontalSkeleton() {
  return (
    <div className="bg-white rounded overflow-hidden">
      <div className="flex">
        <Skeleton className="w-24 h-24 flex-shrink-0" />
        <div className="flex-1 p-2.5 flex flex-col justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-3/4" variant="text" />
            <Skeleton className="h-3 w-1/2" variant="text" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" variant="text" />
              <Skeleton className="h-3 w-12" variant="text" />
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex -space-x-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="w-4 h-4" variant="circular" />
              ))}
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 愿望列表（横向卡片）骨架屏
export function WishListHorizontalSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <WishCardHorizontalSkeleton key={index} />
      ))}
    </div>
  );
}
