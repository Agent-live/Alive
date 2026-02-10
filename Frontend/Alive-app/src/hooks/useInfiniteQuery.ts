import { useState, useCallback, useRef, useEffect } from 'react';

interface UseInfiniteQueryOptions<T> {
  /** 获取数据的函数，接收页码参数 */
  queryFn: (page: number) => Promise<T[]>;
  /** 每页数量 */
  pageSize?: number;
  /** 是否立即加载 */
  immediate?: boolean;
  /** 初始数据 */
  initialData?: T[];
}

interface UseInfiniteQueryResult<T> {
  /** 所有已加载的数据 */
  data: T[];
  /** 是否正在加载（首次或刷新） */
  loading: boolean;
  /** 是否正在加载更多 */
  loadingMore: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 是否还有更多数据 */
  hasMore: boolean;
  /** 加载更多数据 */
  loadMore: () => Promise<void>;
  /** 刷新（重置到第一页） */
  refresh: () => Promise<void>;
  /** 当前页码 */
  page: number;
}

/**
 * 无限滚动数据加载 Hook
 * 支持分页加载、下拉刷新、到底检测
 *
 * @example
 * ```tsx
 * const { data, loading, hasMore, loadMore, refresh } = useInfiniteQuery({
 *   queryFn: (page) => api.getProducts({ page, pageSize: 10 }),
 *   pageSize: 10,
 * });
 *
 * // 配合 InfiniteScroll 组件使用
 * <InfiniteScroll hasMore={hasMore} onLoadMore={loadMore}>
 *   {data.map(item => <ProductCard key={item.id} {...item} />)}
 * </InfiniteScroll>
 * ```
 */
export function useInfiniteQuery<T>({
  queryFn,
  pageSize = 10,
  immediate = true,
  initialData = [],
}: UseInfiniteQueryOptions<T>): UseInfiniteQueryResult<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(immediate);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // 使用 ref 防止重复请求
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 首次加载
  useEffect(() => {
    if (immediate) {
      loadInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitial = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await queryFn(1);
      if (mountedRef.current) {
        setData(result);
        setPage(1);
        setHasMore(result.length >= pageSize);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const result = await queryFn(nextPage);

      if (mountedRef.current) {
        setData((prev) => [...prev, ...result]);
        setPage(nextPage);
        setHasMore(result.length >= pageSize);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setLoadingMore(false);
      }
      loadingRef.current = false;
    }
  }, [hasMore, page, pageSize, queryFn]);

  const refresh = useCallback(async () => {
    setPage(1);
    setHasMore(true);
    await loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryFn, pageSize]);

  return {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    page,
  };
}
