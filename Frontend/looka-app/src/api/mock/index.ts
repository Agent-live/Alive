/**
 * Mock API 工具函数和数据
 */

import { delay } from '../../utils';
import { User, Address, ProductCard, WishCard, OrderCard, WishlistEntry } from '../../types';

// 模拟网络延迟
export const mockDelay = (min = 200, max = 800) =>
  delay(Math.random() * (max - min) + min);

// 模拟 API 响应
export async function mockResponse<T>(data: T, delayMs?: number): Promise<T> {
  await mockDelay(delayMs, delayMs);
  return data;
}

// 模拟错误响应
export async function mockError(message: string, code = 'MOCK_ERROR'): Promise<never> {
  await mockDelay(100, 300);
  throw { code, message };
}

// 模拟用户数据
export const mockUser: User = {
  id: 'user_001',
  phone: '13800138000',
  nickname: '时尚达人',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  email: 'user@example.com',
  gender: 'female',
  bodyMeasurements: {
    height: 165,
    weight: 52,
    bust: 84,
    waist: 64,
    hip: 90,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

// 模拟地址数据
export const mockAddresses: Address[] = [
  {
    id: 'addr_001',
    userId: 'user_001',
    name: '张小姐',
    phone: '13800138000',
    province: '上海市',
    city: '上海市',
    district: '静安区',
    street: '南京西路1234号嘉里中心8楼',
    postalCode: '200040',
    isDefault: true,
    tag: 'company',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'addr_002',
    userId: 'user_001',
    name: '张小姐',
    phone: '13800138000',
    province: '上海市',
    city: '上海市',
    district: '浦东新区',
    street: '陆家嘴环路1000号恒生银行大厦',
    postalCode: '200120',
    isDefault: false,
    tag: 'home',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

// 模拟商品数据
export const mockProducts: ProductCard[] = [
  {
    id: 'prod_001',
    name: '法式复古碎花连衣裙',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    thumbImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
    price: 299,
    originalPrice: 399,
    status: 'wishing',
    likes: 1234,
    isLiked: false,
    designer: { name: 'Luna', avatar: 'https://i.pravatar.cc/100?img=1' },
  },
  {
    id: 'prod_002',
    name: '简约针织开衫外套',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
    thumbImage: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400',
    price: 259,
    originalPrice: 329,
    status: 'making',
    likes: 856,
    isLiked: true,
    designer: { name: 'Mia', avatar: 'https://i.pravatar.cc/100?img=2' },
  },
  {
    id: 'prod_003',
    name: '高腰阔腿牛仔裤',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
    thumbImage: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    price: 189,
    status: 'owned',
    likes: 2341,
    isLiked: false,
    designer: { name: 'Ella', avatar: 'https://i.pravatar.cc/100?img=3' },
  },
  {
    id: 'prod_004',
    name: '韩版宽松短袖T恤',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    thumbImage: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400',
    price: 99,
    originalPrice: 149,
    status: 'shipping',
    likes: 567,
    isLiked: false,
    designer: { name: 'Sophia', avatar: 'https://i.pravatar.cc/100?img=4' },
  },
  {
    id: 'prod_005',
    name: '复古格纹半身裙',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400',
    thumbImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400',
    price: 179,
    originalPrice: 229,
    status: 'wishing',
    likes: 789,
    isLiked: true,
    designer: { name: 'Emma', avatar: 'https://i.pravatar.cc/100?img=5' },
  },
  {
    id: 'prod_006',
    name: '气质西装外套',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    thumbImage: 'https://images.unsplash.com/photo-1594938328870-9623159c8c99?w=400',
    price: 459,
    originalPrice: 599,
    status: 'wishing',
    likes: 1567,
    isLiked: false,
    designer: { name: 'Olivia', avatar: 'https://i.pravatar.cc/100?img=6' },
  },
];

// 模拟拼团数据
export const mockGroupBuys: WishCard[] = [
  {
    id: 'wish_001',
    product: {
      id: 'prod_001',
      name: '法式复古碎花连衣裙',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    },
    type: 'standard',
    status: 'active',
    targetCount: 50,
    currentCount: 38,
    progress: 76,
    originalPrice: 399,
    groupPrice: 299,
    savingsPercent: 25,
    endAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    remainingTime: 86400 * 2,
    participantAvatars: [
      'https://i.pravatar.cc/100?img=1',
      'https://i.pravatar.cc/100?img=2',
      'https://i.pravatar.cc/100?img=3',
    ],
  },
  {
    id: 'wish_002',
    product: {
      id: 'prod_002',
      name: '简约针织开衫外套',
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
    },
    type: 'flash',
    status: 'active',
    targetCount: 30,
    currentCount: 28,
    progress: 93,
    originalPrice: 329,
    groupPrice: 259,
    savingsPercent: 21,
    endAt: new Date(Date.now() + 7200000).toISOString(),
    remainingTime: 7200,
    participantAvatars: [
      'https://i.pravatar.cc/100?img=4',
      'https://i.pravatar.cc/100?img=5',
    ],
  },
  {
    id: 'wish_003',
    product: {
      id: 'prod_005',
      name: '复古格纹半身裙',
      image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400',
    },
    type: 'standard',
    status: 'waiting',
    targetCount: 40,
    currentCount: 12,
    progress: 30,
    originalPrice: 229,
    groupPrice: 179,
    savingsPercent: 22,
    endAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    remainingTime: 86400 * 5,
    participantAvatars: [
      'https://i.pravatar.cc/100?img=6',
    ],
  },
];

// 模拟心愿单数据
export const mockWishlist: WishlistEntry[] = mockProducts.slice(0, 3).map((product, index) => ({
  id: `wishlist_${index + 1}`,
  product,
  addedAt: new Date(Date.now() - 86400000 * (index + 1)).toISOString(),
  groupBuy: index === 0 ? mockGroupBuys[0] : undefined,
}));

// 模拟订单数据
export const mockOrders: OrderCard[] = [
  {
    id: 'order_001',
    orderNumber: 'LK202401150001',
    status: 'processing',
    items: [
      {
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
        name: '法式复古碎花连衣裙',
        quantity: 1,
      },
    ],
    total: 299,
    itemCount: 1,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'order_002',
    orderNumber: 'LK202401100002',
    status: 'shipped',
    items: [
      {
        image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
        name: '简约针织开衫外套',
        quantity: 1,
      },
      {
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
        name: '高腰阔腿牛仔裤',
        quantity: 1,
      },
    ],
    total: 448,
    itemCount: 2,
    createdAt: '2024-01-10T14:20:00Z',
  },
  {
    id: 'order_003',
    orderNumber: 'LK202401050003',
    status: 'completed',
    items: [
      {
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        name: '韩版宽松短袖T恤',
        quantity: 2,
      },
    ],
    total: 198,
    itemCount: 2,
    createdAt: '2024-01-05T09:15:00Z',
  },
];

// 生成唯一 ID
export function generateMockId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
