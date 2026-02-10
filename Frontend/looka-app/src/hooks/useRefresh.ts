import { useState, useCallback, useEffect } from 'react';

interface UseRefreshOptions {
  /**
   * 是否在首次挂载时自动执行
   * @default true
   */
  immediate?: boolean;
}

interface UseRefreshResult<T> {
  /** 数据 */
  data: T | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误状态 */
  error: Error | null;
  /** 触发刷新 */
  refresh: () => void;
  /** 刷新计数器（用于依赖追踪） */
  refreshKey: number;
}

/**
 * 解决 setActiveTab(activeTab) 不触发 useEffect 的问题
 * 使用 refreshKey 强制触发数据重新获取
 *
 * @example
 * ```tsx
 * const { data, loading, error, refresh } = useRefresh(
 *   () => fetchProducts({ sortBy: 'newest' })
 * );
 *
 * // 重试按钮
 * <button onClick={refresh}>重试</button>
 * ```
 */
export function useRefresh<T>(
  fetchFn: () => Promise<T>,
  options: UseRefreshOptions = {}
): UseRefreshResult<T> {
  const { immediate = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!immediate && refreshKey === 0) return;

    let cancelled = false;

    const doFetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    doFetch();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, fetchFn, immediate]);

  return { data, loading, error, refresh, refreshKey };
}

/**
 * 带依赖的刷新 Hook
 * 当依赖变化时自动刷新，同时支持手动刷新
 *
 * @example
 * ```tsx
 * const { data, loading, refresh } = useRefreshWithDeps(
 *   () => fetchProducts({ sortBy, style }),
 *   [sortBy, style]
 * );
 * ```
 */
export function useRefreshWithDeps<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList
): UseRefreshResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    doFetch();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, ...deps]);

  return { data, loading, error, refresh, refreshKey };
}
