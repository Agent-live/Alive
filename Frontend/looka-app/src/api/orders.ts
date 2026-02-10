/**
 * 订单相关 API
 */

import {
  Order,
  OrderCard,
  OrderQueryParams,
  CreateOrderRequest,
  PayOrderRequest,
  PaymentResult,
  PaginatedResponse,
  OrderStatus,
  Size,
} from '../types';
import { mockDelay, mockOrders, mockProducts, mockAddresses, generateMockId } from './mock';

// 是否使用 Mock API
const USE_MOCK = true;

// 模拟订单存储
const orders: Order[] = [];

/**
 * 获取订单列表
 */
async function getOrders(
  params?: OrderQueryParams
): Promise<PaginatedResponse<OrderCard>> {
  if (USE_MOCK) {
    await mockDelay(400, 800);

    let filtered = [...mockOrders];

    // 状态筛选
    if (params?.status) {
      filtered = filtered.filter((o) => o.status === params.status);
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total: filtered.length,
      page,
      pageSize,
      hasMore: start + pageSize < filtered.length,
    };
  }

  // return api.get('/orders', params);
  throw new Error('Real API not implemented');
}

/**
 * 获取订单详情
 */
async function getOrderDetail(id: string): Promise<Order> {
  if (USE_MOCK) {
    await mockDelay(300, 600);

    const orderCard = mockOrders.find((o) => o.id === id);
    if (!orderCard) {
      throw { code: 'NOT_FOUND', message: '订单不存在' };
    }

    // 构造完整订单信息
    const order: Order = {
      id: orderCard.id,
      orderNumber: orderCard.orderNumber,
      userId: 'user_001',
      items: orderCard.items.map((item, index) => ({
        id: `item_${index}`,
        product: mockProducts[index] || {
          id: `prod_${index}`,
          name: item.name,
          image: item.image,
          price: orderCard.total / orderCard.itemCount,
          status: 'owned',
        },
        quantity: item.quantity,
        size: 'M' as Size,
        color: '黑色',
        price: orderCard.total / orderCard.itemCount,
      })),
      address: mockAddresses[0],
      paymentMethod: 'wechat',
      status: orderCard.status,
      pricing: {
        subtotal: orderCard.total,
        shipping: 0,
        discount: 0,
        total: orderCard.total,
        currency: 'CNY',
      },
      shipping:
        orderCard.status === 'shipped' || orderCard.status === 'delivered'
          ? {
              carrier: '顺丰速运',
              trackingNumber: 'SF1234567890',
              estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
              tracks: [
                {
                  time: new Date(Date.now() - 3600000 * 2).toISOString(),
                  status: '运输中',
                  location: '上海市',
                  description: '包裹已从上海转运中心发出',
                },
                {
                  time: new Date(Date.now() - 86400000).toISOString(),
                  status: '已发货',
                  location: '杭州市',
                  description: '商家已发货，等待快递员揽收',
                },
              ],
            }
          : undefined,
      timeline: [
        {
          time: orderCard.createdAt,
          status: 'pending' as OrderStatus,
          title: '订单创建',
          description: '订单已创建，等待支付',
        },
        {
          time: new Date(new Date(orderCard.createdAt).getTime() + 300000).toISOString(),
          status: 'paid' as OrderStatus,
          title: '支付成功',
          description: '订单已支付，等待商家处理',
        },
        ...(orderCard.status !== 'pending'
          ? [
              {
                time: new Date(new Date(orderCard.createdAt).getTime() + 86400000).toISOString(),
                status: 'processing' as OrderStatus,
                title: '开始制作',
                description: '商品正在精心制作中',
              },
            ]
          : []),
        ...(orderCard.status === 'shipped' || orderCard.status === 'completed'
          ? [
              {
                time: new Date(new Date(orderCard.createdAt).getTime() + 86400000 * 3).toISOString(),
                status: 'shipped' as OrderStatus,
                title: '已发货',
                description: '商品已发货，顺丰速运 SF1234567890',
              },
            ]
          : []),
        ...(orderCard.status === 'completed'
          ? [
              {
                time: new Date(new Date(orderCard.createdAt).getTime() + 86400000 * 5).toISOString(),
                status: 'completed' as OrderStatus,
                title: '已完成',
                description: '订单已完成，感谢您的购买',
              },
            ]
          : []),
      ],
      createdAt: orderCard.createdAt,
      updatedAt: orderCard.createdAt,
      paidAt: orderCard.status !== 'pending' ? orderCard.createdAt : undefined,
    };

    return order;
  }

  // return api.get(`/orders/${id}`);
  throw new Error('Real API not implemented');
}

/**
 * 创建订单
 */
async function createOrder(data: CreateOrderRequest): Promise<Order> {
  if (USE_MOCK) {
    await mockDelay(500, 1000);

    const orderNumber = `LK${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(orders.length + 1).padStart(4, '0')}`;
    const address = mockAddresses.find((a) => a.id === data.addressId);

    if (!address) {
      throw { code: 'INVALID_ADDRESS', message: '地址不存在' };
    }

    const items = data.items.map((item) => {
      const product = mockProducts.find((p) => p.id === item.productId);
      if (!product) {
        throw { code: 'INVALID_PRODUCT', message: `商品 ${item.productId} 不存在` };
      }
      return {
        id: generateMockId('item'),
        product,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: product.price,
        originalPrice: product.originalPrice,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order: Order = {
      id: generateMockId('order'),
      orderNumber,
      userId: 'user_001',
      items,
      address,
      status: 'pending',
      pricing: {
        subtotal,
        shipping: subtotal >= 299 ? 0 : 15,
        discount: 0,
        total: subtotal + (subtotal >= 299 ? 0 : 15),
        currency: 'CNY',
      },
      timeline: [
        {
          time: new Date().toISOString(),
          status: 'pending',
          title: '订单创建',
          description: '订单已创建，等待支付',
        },
      ],
      note: data.note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.push(order);
    return order;
  }

  // return api.post('/orders', data);
  throw new Error('Real API not implemented');
}

/**
 * 支付订单
 */
async function payOrder(data: PayOrderRequest): Promise<PaymentResult> {
  if (USE_MOCK) {
    await mockDelay(1000, 2000); // 模拟支付处理时间

    const order = orders.find((o) => o.id === data.orderId);
    if (!order) {
      throw { code: 'NOT_FOUND', message: '订单不存在' };
    }

    if (order.status !== 'pending') {
      throw { code: 'INVALID_STATUS', message: '订单状态不正确' };
    }

    // 更新订单状态
    order.status = 'paid';
    order.paymentMethod = data.paymentMethod;
    order.paidAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    order.timeline.push({
      time: new Date().toISOString(),
      status: 'paid',
      title: '支付成功',
      description: `使用${data.paymentMethod === 'wechat' ? '微信' : data.paymentMethod === 'alipay' ? '支付宝' : 'Apple Pay'}支付`,
    });

    return {
      success: true,
      orderId: order.id,
      transactionId: generateMockId('txn'),
      paidAmount: order.pricing.total,
      paidAt: order.paidAt,
    };
  }

  // return api.post('/orders/pay', data);
  throw new Error('Real API not implemented');
}

/**
 * 取消订单
 */
async function cancelOrder(id: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(300, 600);

    const order = orders.find((o) => o.id === id);
    if (!order) {
      throw { code: 'NOT_FOUND', message: '订单不存在' };
    }

    if (order.status !== 'pending') {
      throw { code: 'INVALID_STATUS', message: '该订单不可取消' };
    }

    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    return;
  }

  // return api.post(`/orders/${id}/cancel`);
  throw new Error('Real API not implemented');
}

/**
 * 确认收货
 */
async function confirmDelivery(id: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(300, 600);

    const order = orders.find((o) => o.id === id);
    if (!order) {
      throw { code: 'NOT_FOUND', message: '订单不存在' };
    }

    if (order.status !== 'shipped' && order.status !== 'delivered') {
      throw { code: 'INVALID_STATUS', message: '该订单不可确认收货' };
    }

    order.status = 'completed';
    order.completedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    return;
  }

  // return api.post(`/orders/${id}/confirm`);
  throw new Error('Real API not implemented');
}

/**
 * 获取订单数量统计
 */
async function getOrderCounts(): Promise<Record<OrderStatus, number>> {
  if (USE_MOCK) {
    await mockDelay(200, 400);
    return {
      pending: 1,
      paid: 0,
      processing: 2,
      shipped: 1,
      delivered: 0,
      completed: 5,
      cancelled: 0,
      refunded: 0,
    };
  }

  // return api.get('/orders/counts');
  throw new Error('Real API not implemented');
}

export const orderApi = {
  getOrders,
  getOrderDetail,
  createOrder,
  payOrder,
  cancelOrder,
  confirmDelivery,
  getOrderCounts,
};
