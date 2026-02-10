import { useEffect, useRef, useCallback, memo } from 'react';

interface InfiniteScrollProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 是否还有更多数据 */
  hasMore: boolean;
  /** 加载更多的回调 */
  onLoadMore: () => void | Promise<void>;
  /** 是否正在加载更多 */
  loadingMore?: boolean;
  /** 触发加载的阈值（距底部多少像素触发），默认 200 */
  threshold?: number;
  /** 加载中显示的内容 */
  loader?: React.ReactNode;
  /** 没有更多数据时显示的内容 */
  endMessage?: React.ReactNode;
  /** 自定义容器类名 */
  className?: string;
}

/**
 * 无限滚动组件
 * 基于 IntersectionObserver 实现，性能优异
 *
 * @example
 * ```tsx
 * <InfiniteScroll
 *   hasMore={hasMore}
 *   onLoadMore={loadMore}
 *   loadingMore={loadingMore}
 *   loader={<div className="py-4 text-center text-gray-400">加载中...</div>}
 *   endMessage={<div className="py-4 text-center text-gray-400">没有更多了</div>}
 * >
 *   {items.map(item => <ItemCard key={item.id} {...item} />)}
 * </InfiniteScroll>
 * ```
 */
function InfiniteScrollComponent({
  children,
  hasMore,
  onLoadMore,
  loadingMore = false,
  threshold = 200,
  loader,
  endMessage,
  className = '',
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const handleIntersect = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (entry.isIntersecting && hasMore && !loadingRef.current) {
        loadingRef.current = true;
        await onLoadMore();
        loadingRef.current = false;
      }
    },
    [hasMore, onLoadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // 创建 IntersectionObserver
    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: `0px 0px ${threshold}px 0px`,
      threshold: 0,
    });

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleIntersect, threshold]);

  // 更新 loadingRef 状态
  useEffect(() => {
    loadingRef.current = loadingMore;
  }, [loadingMore]);

  return (
    <div className={className}>
      {children}

      {/* 哨兵元素，用于触发加载 */}
      <div ref={sentinelRef} className="h-px" />

      {/* 加载中提示 */}
      {loadingMore && loader}

      {/* 底部提示 */}
      {!hasMore && !loadingMore && endMessage}
    </div>
  );
}

export const InfiniteScroll = memo(InfiniteScrollComponent);

/**
 * 默认的加载中组件
 */
export function DefaultLoader() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="ml-2 text-sm text-gray-400">加载中...</span>
    </div>
  );
}

/**
 * 默认的结束提示组件
 */
export function DefaultEndMessage({ text = '没有更多了' }: { text?: string }) {
  return (
    <div className="text-center py-6">
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}
