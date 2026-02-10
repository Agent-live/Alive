/**
 * 心愿/拼团相关 API
 */

import {
  WishCard,
  WishDetail,
  WishlistEntry,
  WishQueryParams,
  JoinGroupBuyRequest,
  JoinGroupBuyResponse,
  PaginatedResponse,
  UserWishlist,
  WishStatus,
} from '../types';
import { mockDelay, mockGroupBuys, mockWishlist, mockProducts, generateMockId } from './mock';

// 是否使用 Mock API
const USE_MOCK = true;

// 模拟数据存储
let wishlist = [...mockWishlist];

/**
 * 获取拼团列表
 */
async function getGroupBuys(
  params?: WishQueryParams
): Promise<PaginatedResponse<WishCard>> {
  if (USE_MOCK) {
    await mockDelay(400, 800);

    let filtered = [...mockGroupBuys];

    // 状态筛选
    if (params?.status) {
      filtered = filtered.filter((g) => g.status === params.status);
    }

    // 类型筛选
    if (params?.type) {
      filtered = filtered.filter((g) => g.type === params.type);
    }

    // 排序
    if (params?.sortBy === 'ending_soon') {
      filtered.sort((a, b) => a.remainingTime - b.remainingTime);
    } else if (params?.sortBy === 'almost_there') {
      filtered.sort((a, b) => b.progress - a.progress);
    } else if (params?.sortBy === 'popular') {
      filtered.sort((a, b) => b.currentCount - a.currentCount);
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

  // return api.get('/wishes/group-buys', params);
  throw new Error('Real API not implemented');
}

/**
 * 获取拼团详情
 */
async function getGroupBuyDetail(id: string): Promise<WishDetail> {
  if (USE_MOCK) {
    await mockDelay(300, 600);

    const groupBuy = mockGroupBuys.find((g) => g.id === id);
    if (!groupBuy) {
      throw { code: 'NOT_FOUND', message: '拼团不存在' };
    }

    return {
      id: groupBuy.id,
      product: mockProducts.find((p) => p.id === groupBuy.product.id) || {
        id: groupBuy.product.id,
        name: groupBuy.product.name,
        image: groupBuy.product.image,
        price: groupBuy.groupPrice,
        status: 'wishing',
      },
      type: groupBuy.type,
      status: groupBuy.status as WishStatus,
      targetCount: groupBuy.targetCount,
      currentCount: groupBuy.currentCount,
      participants: groupBuy.participantAvatars.map((avatar, index) => ({
        id: `participant_${index}`,
        user: {
          id: `user_${index}`,
          nickname: `用户${index + 1}`,
          avatar,
        },
        joinedAt: new Date(Date.now() - 3600000 * (index + 1)).toISOString(),
        isInitiator: index === 0,
      })),
      originalPrice: groupBuy.originalPrice,
      groupPrice: groupBuy.groupPrice,
      savings: groupBuy.originalPrice - groupBuy.groupPrice,
      savingsPercent: groupBuy.savingsPercent,
      startAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      endAt: groupBuy.endAt,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      createdBy: {
        id: 'user_initiator',
        nickname: '发起人',
        avatar: groupBuy.participantAvatars[0],
      },
      description: '一起拼团，享受更低价格！达到目标人数即可成团。',
      rules: [
        '拼团期间可随时加入',
        '达到目标人数后自动成团',
        '成团后统一安排发货',
        '未成团将自动退款',
      ],
      milestones: [
        { count: 10, discount: 10, reached: groupBuy.currentCount >= 10, reachedAt: groupBuy.currentCount >= 10 ? new Date().toISOString() : undefined },
        { count: 30, discount: 20, reached: groupBuy.currentCount >= 30, reachedAt: groupBuy.currentCount >= 30 ? new Date().toISOString() : undefined },
        { count: groupBuy.targetCount, discount: groupBuy.savingsPercent, reached: groupBuy.currentCount >= groupBuy.targetCount },
      ],
    };
  }

  // return api.get(`/wishes/group-buys/${id}`);
  throw new Error('Real API not implemented');
}

/**
 * 加入拼团
 */
async function joinGroupBuy(data: JoinGroupBuyRequest): Promise<JoinGroupBuyResponse> {
  if (USE_MOCK) {
    await mockDelay(500, 1000);

    const groupBuy = mockGroupBuys.find((g) => g.id === data.wishId);
    if (!groupBuy) {
      throw { code: 'NOT_FOUND', message: '拼团不存在' };
    }

    if (groupBuy.status !== 'active' && groupBuy.status !== 'waiting') {
      throw { code: 'INVALID_STATUS', message: '拼团已结束' };
    }

    const newCount = groupBuy.currentCount + 1;
    const newStatus: WishStatus = newCount >= groupBuy.targetCount ? 'success' : 'active';

    // 更新模拟数据
    const index = mockGroupBuys.findIndex((g) => g.id === data.wishId);
    if (index !== -1) {
      mockGroupBuys[index] = {
        ...mockGroupBuys[index],
        currentCount: newCount,
        status: newStatus,
        progress: (newCount / groupBuy.targetCount) * 100,
      };
    }

    return {
      success: true,
      participation: {
        id: generateMockId('part'),
        user: {
          id: 'current_user',
          nickname: '我',
          avatar: 'https://i.pravatar.cc/100?img=10',
        },
        joinedAt: new Date().toISOString(),
        isInitiator: false,
      },
      currentCount: newCount,
      status: newStatus,
    };
  }

  // return api.post('/wishes/join', data);
  throw new Error('Real API not implemented');
}

/**
 * 获取心愿单
 */
async function getWishlist(): Promise<UserWishlist> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    return {
      items: wishlist,
      total: wishlist.length,
    };
  }

  // return api.get('/wishes/wishlist');
  throw new Error('Real API not implemented');
}

/**
 * 添加到心愿单
 */
async function addToWishlist(productId: string, note?: string): Promise<WishlistEntry> {
  if (USE_MOCK) {
    await mockDelay(300, 500);

    const product = mockProducts.find((p) => p.id === productId);
    if (!product) {
      throw { code: 'NOT_FOUND', message: '商品不存在' };
    }

    // 检查是否已存在
    const exists = wishlist.some((item) => item.product.id === productId);
    if (exists) {
      throw { code: 'ALREADY_EXISTS', message: '商品已在心愿单中' };
    }

    const entry: WishlistEntry = {
      id: generateMockId('wish'),
      product,
      addedAt: new Date().toISOString(),
      note,
    };

    wishlist.unshift(entry);
    return entry;
  }

  // return api.post('/wishes/wishlist', { productId, note });
  throw new Error('Real API not implemented');
}

/**
 * 从心愿单移除
 */
async function removeFromWishlist(id: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(200, 400);

    const index = wishlist.findIndex((item) => item.id === id);
    if (index === -1) {
      throw { code: 'NOT_FOUND', message: '心愿单项不存在' };
    }

    wishlist.splice(index, 1);
    return;
  }

  // return api.delete(`/wishes/wishlist/${id}`);
  throw new Error('Real API not implemented');
}

/**
 * 创建心愿（发起拼团）
 */
async function createWish(productId: string, _message?: string): Promise<WishCard> {
  if (USE_MOCK) {
    await mockDelay(500, 800);

    const product = mockProducts.find((p) => p.id === productId);
    if (!product) {
      throw { code: 'NOT_FOUND', message: '商品不存在' };
    }

    const newWish: WishCard = {
      id: generateMockId('wish'),
      product: {
        id: product.id,
        name: product.name,
        image: product.image,
      },
      type: 'standard',
      status: 'waiting',
      targetCount: 30,
      currentCount: 1,
      progress: 3.33,
      originalPrice: product.originalPrice || product.price,
      groupPrice: Math.round(product.price * 0.8),
      savingsPercent: 20,
      endAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      remainingTime: 86400 * 7,
      participantAvatars: ['https://i.pravatar.cc/100?img=10'],
    };

    mockGroupBuys.unshift(newWish);
    return newWish;
  }

  // return api.post('/wishes', { productId, message });
  throw new Error('Real API not implemented');
}

export const wishApi = {
  getGroupBuys,
  getGroupBuyDetail,
  joinGroupBuy,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  createWish,
};
