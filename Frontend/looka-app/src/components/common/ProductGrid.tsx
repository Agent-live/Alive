import React, { memo } from 'react';
import { CardMasonry } from '../reactbits/Masonry';

interface ProductGridProps<T> {
  /** 数据列表 */
  items: T[];
  /** 渲染单个卡片的函数 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** 列数配置 */
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  /** 间距 */
  gap?: number;
  /** 骨架屏组件 */
  skeleton?: React.ReactNode;
  /** 是否加载中 */
  loading?: boolean;
  /** 空状态组件 */
  empty?: React.ReactNode;
  /** 底部额外内容（如添加按钮） */
  footer?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

/**
 * 统一的产品网格展示组件
 * 基于 CardMasonry 封装，支持骨架屏、空状态、自定义渲染
 *
 * @example
 * ```tsx
 * <ProductGrid
 *   items={products}
 *   renderItem={(product, index) => (
 *     <ProductCard key={product.id} {...product} />
 *   )}
 *   loading={isLoading}
 *   skeleton={<ProductListSkeleton count={6} />}
 *   empty={<EmptyState title="暂无内容" />}
 * />
 * ```
 */
function ProductGridComponent<T extends { id: string | number }>({
  items,
  renderItem,
  columns = { default: 2 },
  gap = 6,
  skeleton,
  loading = false,
  empty,
  footer,
  className = '',
}: ProductGridProps<T>) {
  // 加载状态
  if (loading && skeleton) {
    return <>{skeleton}</>;
  }

  // 空状态
  if (!loading && items.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className={className}>
      <CardMasonry columns={columns} gap={gap}>
        {items.map((item, index) => renderItem(item, index))}
        {footer}
      </CardMasonry>
    </div>
  );
}

// 使用 memo 优化重渲染
export const ProductGrid = memo(ProductGridComponent) as typeof ProductGridComponent;

// 预定义的宽高比类名，用于瀑布流效果
export const aspectRatioClasses = [
  'aspect-card-1',
  'aspect-card-2',
  'aspect-card-3',
  'aspect-card-4',
] as const;

/**
 * 根据索引获取宽高比类名
 * 用于创建视觉上不单调的瀑布流效果
 */
export function getAspectRatioClass(index: number): string {
  return aspectRatioClasses[index % aspectRatioClasses.length];
}
