/**
 * 商品相关 API
 */

import {
  ProductCard,
  ProductDetail,
  ProductSearchParams,
  PaginatedResponse,
  ClosetItem,
  DesignResult,
  TryOnResult,
} from '../types';
import { mockDelay, mockProducts, generateMockId } from './mock';

// 是否使用 Mock API
const USE_MOCK = true;

/**
 * 获取商品列表
 */
async function getProducts(
  params?: ProductSearchParams
): Promise<PaginatedResponse<ProductCard>> {
  if (USE_MOCK) {
    await mockDelay(400, 800);

    let filtered = [...mockProducts];

    // 关键词搜索
    if (params?.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(keyword)
      );
    }

    // 状态筛选
    if (params?.status) {
      filtered = filtered.filter((p) => p.status === params.status);
    }

    // 排序
    if (params?.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (params?.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (params?.sortBy === 'popular') {
      filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
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

  // return api.get('/products', params);
  throw new Error('Real API not implemented');
}

/**
 * 获取商品详情
 */
async function getProductDetail(id: string): Promise<ProductDetail> {
  if (USE_MOCK) {
    await mockDelay(300, 600);

    const product = mockProducts.find((p) => p.id === id);
    if (!product) {
      throw { code: 'NOT_FOUND', message: '商品不存在' };
    }

    return {
      id: product.id,
      name: product.name,
      description: '这是一款精心设计的时尚单品，采用优质面料制作，穿着舒适，款式百搭。',
      images: [
        { id: '1', url: product.image, isMain: true },
        { id: '2', url: product.image.replace('w=400', 'w=401') },
        { id: '3', url: product.image.replace('w=400', 'w=402') },
      ],
      price: {
        current: product.price,
        original: product.originalPrice,
        currency: 'CNY',
        discount: product.originalPrice
          ? Math.round((1 - product.price / product.originalPrice) * 100)
          : undefined,
      },
      colors: [
        { id: 'c1', name: '黑色', value: '#000000' },
        { id: 'c2', name: '白色', value: '#FFFFFF' },
        { id: 'c3', name: '米色', value: '#F5F5DC' },
      ],
      sizes: [
        { size: 'S', available: true, stock: 10 },
        { size: 'M', available: true, stock: 15 },
        { size: 'L', available: true, stock: 8 },
        { size: 'XL', available: false, stock: 0 },
      ],
      category: { id: 'cat1', name: '连衣裙', slug: 'dress' },
      tags: [
        { id: 't1', name: '法式', slug: 'french' },
        { id: 't2', name: '复古', slug: 'vintage' },
      ],
      status: product.status,
      designer: product.designer
        ? { id: 'd1', nickname: product.designer.name, avatar: product.designer.avatar }
        : undefined,
      stats: {
        views: 5678,
        likes: product.likes || 0,
        wishes: 234,
        orders: 156,
      },
      materials: ['聚酯纤维 65%', '棉 35%'],
      careInstructions: ['手洗', '不可漂白', '低温熨烫'],
      sizeChart: [
        { size: 'S', bust: '82-86', waist: '64-68', hip: '88-92', length: '95' },
        { size: 'M', bust: '86-90', waist: '68-72', hip: '92-96', length: '97' },
        { size: 'L', bust: '90-94', waist: '72-76', hip: '96-100', length: '99' },
      ],
      relatedProducts: mockProducts.filter((p) => p.id !== id).slice(0, 4),
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    };
  }

  // return api.get(`/products/${id}`);
  throw new Error('Real API not implemented');
}

/**
 * 搜索商品
 */
async function searchProducts(
  keyword: string,
  params?: Omit<ProductSearchParams, 'keyword'>
): Promise<PaginatedResponse<ProductCard>> {
  return getProducts({ ...params, keyword });
}

/**
 * 获取热门搜索关键词
 */
async function getHotKeywords(): Promise<string[]> {
  if (USE_MOCK) {
    await mockDelay(200, 400);
    return ['法式连衣裙', '针织开衫', '高腰牛仔裤', '西装外套', '碎花裙', '毛衣'];
  }

  // return api.get('/products/hot-keywords');
  throw new Error('Real API not implemented');
}

/**
 * 获取衣橱列表
 */
async function getClosetItems(): Promise<ClosetItem[]> {
  if (USE_MOCK) {
    await mockDelay(400, 700);
    return mockProducts.slice(0, 4).map((product, index) => ({
      id: `closet_${index + 1}`,
      product,
      status: product.status,
      purchaseDate: '2024-01-15',
      orderNumber: `LK2024011500${index + 1}`,
      addedAt: new Date(Date.now() - 86400000 * (index + 1)).toISOString(),
    }));
  }

  // return api.get('/user/closet');
  throw new Error('Real API not implemented');
}

/**
 * 点赞/取消点赞商品
 */
async function toggleLike(productId: string): Promise<{ liked: boolean; likes: number }> {
  if (USE_MOCK) {
    await mockDelay(200, 400);
    const product = mockProducts.find((p) => p.id === productId);
    const newLiked = !product?.isLiked;
    return {
      liked: newLiked,
      likes: (product?.likes || 0) + (newLiked ? 1 : -1),
    };
  }

  // return api.post(`/products/${productId}/like`);
  throw new Error('Real API not implemented');
}

/**
 * AI 设计生成
 */
async function generateDesign(prompt: string, style?: string): Promise<DesignResult> {
  if (USE_MOCK) {
    await mockDelay(2000, 4000); // 模拟生成时间

    return {
      id: generateMockId('design'),
      prompt,
      images: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      ],
      style: style || 'casual',
      createdAt: new Date().toISOString(),
    };
  }

  // return api.post('/ai/design', { prompt, style });
  throw new Error('Real API not implemented');
}

/**
 * 虚拟试穿
 */
async function tryOn(productId: string, userImage: string): Promise<TryOnResult> {
  if (USE_MOCK) {
    await mockDelay(2000, 4000); // 模拟处理时间

    const product = mockProducts.find((p) => p.id === productId);

    return {
      id: generateMockId('tryon'),
      productId,
      userImage,
      resultImage: product?.image || userImage,
      createdAt: new Date().toISOString(),
    };
  }

  // return api.post('/ai/try-on', { productId, userImage });
  throw new Error('Real API not implemented');
}

export const productApi = {
  getProducts,
  getProductDetail,
  searchProducts,
  getHotKeywords,
  getClosetItems,
  toggleLike,
  generateDesign,
  tryOn,
};
