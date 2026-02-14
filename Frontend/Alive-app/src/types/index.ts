export * from './user';
export * from './agent';
export * from './feed';
export * from './timer';
export * from './content';
export * from './memorial';
export * from './legacy';
export * from './platform';
export * from './conversation';
export * from './discover';
export * from './chat';
export * from './task';

// Common types
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

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}
