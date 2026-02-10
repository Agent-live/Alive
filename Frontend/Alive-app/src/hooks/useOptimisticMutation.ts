import { useState, useCallback, useRef } from 'react';

interface UseOptimisticMutationOptions<TData, TVariables, TContext> {
  /** 执行实际变更的函数 */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /**
   * 在变更前调用，用于乐观更新 UI
   * 返回值会传递给 rollback 用于回滚
   */
  onMutate?: (variables: TVariables) => TContext | Promise<TContext>;
  /** 变更成功后调用 */
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  /** 变更失败时调用，用于回滚 */
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
  /** 无论成功失败都会调用 */
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: TContext | undefined
  ) => void;
}

interface UseOptimisticMutationResult<TData, TVariables> {
  /** 执行变更 */
  mutate: (variables: TVariables) => Promise<TData | undefined>;
  /** 异步执行变更 */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** 是否正在执行 */
  isPending: boolean;
  /** 是否成功 */
  isSuccess: boolean;
  /** 是否失败 */
  isError: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 返回的数据 */
  data: TData | undefined;
  /** 重置状态 */
  reset: () => void;
}

/**
 * 乐观更新 Hook
 * 先更新 UI，后发请求，失败时回滚
 *
 * @example
 * ```tsx
 * const [likes, setLikes] = useState(product.likes);
 * const [isLiked, setIsLiked] = useState(product.isLiked);
 *
 * const likeMutation = useOptimisticMutation({
 *   mutationFn: () => api.toggleLike(product.id),
 *   onMutate: () => {
 *     // 保存旧状态用于回滚
 *     const previous = { likes, isLiked };
 *     // 乐观更新
 *     setIsLiked(!isLiked);
 *     setLikes(isLiked ? likes - 1 : likes + 1);
 *     return previous;
 *   },
 *   onError: (_, __, context) => {
 *     // 回滚到旧状态
 *     if (context) {
 *       setLikes(context.likes);
 *       setIsLiked(context.isLiked);
 *     }
 *   },
 * });
 *
 * <button onClick={() => likeMutation.mutate()}>
 *   {isLiked ? '已喜欢' : '喜欢'} {likes}
 * </button>
 * ```
 */
export function useOptimisticMutation<
  TData = unknown,
  TVariables = void,
  TContext = unknown
>({
  mutationFn,
  onMutate,
  onSuccess,
  onError,
  onSettled,
}: UseOptimisticMutationOptions<TData, TVariables, TContext>): UseOptimisticMutationResult<
  TData,
  TVariables
> {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);

  const mountedRef = useRef(true);

  const reset = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
    setData(undefined);
  }, []);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsPending(true);
      setIsSuccess(false);
      setIsError(false);
      setError(null);

      let context: TContext | undefined;

      try {
        // 执行乐观更新
        if (onMutate) {
          context = await onMutate(variables);
        }

        // 执行实际请求
        const result = await mutationFn(variables);

        if (mountedRef.current) {
          setData(result);
          setIsSuccess(true);
          onSuccess?.(result, variables, context);
        }

        onSettled?.(result, null, variables, context);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (mountedRef.current) {
          setError(error);
          setIsError(true);
        }

        // 执行回滚
        onError?.(error, variables, context);
        onSettled?.(undefined, error, variables, context);

        throw error;
      } finally {
        if (mountedRef.current) {
          setIsPending(false);
        }
      }
    },
    [mutationFn, onMutate, onSuccess, onError, onSettled]
  );

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | undefined> => {
      try {
        return await mutateAsync(variables);
      } catch {
        // mutate 不抛出错误，错误通过 error 状态获取
        return undefined;
      }
    },
    [mutateAsync]
  );

  return {
    mutate,
    mutateAsync,
    isPending,
    isSuccess,
    isError,
    error,
    data,
    reset,
  };
}

/**
 * 简化版本：用于简单的点赞/收藏等操作
 */
export function useToggleMutation(
  toggleFn: (id: string) => Promise<{ liked: boolean; likes: number }>,
  onUpdate: (id: string, liked: boolean, likes: number) => void
) {
  return useOptimisticMutation({
    mutationFn: toggleFn,
    onSuccess: (result, id) => {
      onUpdate(id, result.liked, result.likes);
    },
  });
}
