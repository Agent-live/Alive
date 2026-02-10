// 导出所有类型
export * from './user';
export * from './agent';
export * from './feed';
export * from './time';
export * from './memorial';
export * from './platform';

// 通用类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// 加载状态
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Toast 类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// 时间戳
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}
