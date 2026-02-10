// 导出所有类型
export * from './user';
export * from './product';
export * from './order';
export * from './wish';
export * from './design';
export * from './production';

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

// 商品状态
export type ProductStatus = 'wishing' | 'making' | 'shipping' | 'owned';

// 订单状态
export type OrderStatus =
  | 'pending'      // 待支付
  | 'paid'         // 已支付
  | 'processing'   // 制作中
  | 'shipped'      // 已发货
  | 'delivered'    // 已送达
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'refunded';    // 已退款

// 支付方式
export type PaymentMethod = 'wechat' | 'alipay' | 'apple_pay';

// 尺码类型
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'FREE';

// 颜色选项
export interface ColorOption {
  id: string;
  name: string;
  value: string; // hex color
  image?: string;
}

// 尺码选项
export interface SizeOption {
  size: Size;
  available: boolean;
  stock?: number;
}

// 图片类型
export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isMain?: boolean;
}

// 价格信息
export interface PriceInfo {
  current: number;
  original?: number;
  currency?: string;
  discount?: number; // percentage
}

// 身材数据
export interface BodyMeasurements {
  height: number;      // cm
  weight: number;      // kg
  bust?: number;       // cm
  waist?: number;      // cm
  hip?: number;        // cm
  shoulder?: number;   // cm
}

// 风格标签
export interface StyleTag {
  id: string;
  name: string;
  slug: string;
}

// 时间戳
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}
