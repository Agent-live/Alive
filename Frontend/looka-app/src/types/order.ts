import { OrderStatus, PaymentMethod, Size } from './index';
import { Address } from './user';
import { ProductCard } from './product';

// 订单基本信息
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  address: Address;
  paymentMethod?: PaymentMethod;
  status: OrderStatus;
  pricing: OrderPricing;
  shipping?: ShippingInfo;
  timeline: OrderTimeline[];
  note?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
}

// 订单商品项
export interface OrderItem {
  id: string;
  product: ProductCard;
  quantity: number;
  size: Size;
  color: string;
  price: number;
  originalPrice?: number;
}

// 订单价格明细
export interface OrderPricing {
  subtotal: number;       // 商品总价
  shipping: number;       // 运费
  discount: number;       // 优惠金额
  total: number;          // 实付金额
  currency: string;       // 货币
}

// 物流信息
export interface ShippingInfo {
  carrier: string;        // 物流公司
  trackingNumber: string; // 物流单号
  estimatedDelivery?: string; // 预计送达时间
  tracks: ShippingTrack[];
}

// 物流轨迹
export interface ShippingTrack {
  time: string;
  status: string;
  location?: string;
  description: string;
}

// 订单时间线
export interface OrderTimeline {
  time: string;
  status: OrderStatus;
  title: string;
  description?: string;
}

// 订单卡片数据（用于列表展示）
export interface OrderCard {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: {
    image: string;
    name: string;
    quantity: number;
  }[];
  total: number;
  itemCount: number;
  createdAt: string;
}

// 创建订单请求
export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
    size: Size;
    color: string;
  }[];
  addressId: string;
  note?: string;
  couponCode?: string;
}

// 订单支付请求
export interface PayOrderRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
}

// 支付结果
export interface PaymentResult {
  success: boolean;
  orderId: string;
  transactionId?: string;
  paidAmount: number;
  paidAt: string;
}

// 订单查询参数
export interface OrderQueryParams {
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
}

// 购物车商品
export interface CartItem {
  id: string;
  product: ProductCard;
  quantity: number;
  size: Size;
  color: string;
  selected: boolean;
}

// 购物车统计
export interface CartSummary {
  itemCount: number;
  selectedCount: number;
  subtotal: number;
  discount: number;
  total: number;
}

// 优惠券
export interface Coupon {
  id: string;
  code: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  expiresAt: string;
  isUsed: boolean;
}
