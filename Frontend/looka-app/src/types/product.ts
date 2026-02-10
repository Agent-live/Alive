import {
  ProductStatus,
  ColorOption,
  SizeOption,
  ProductImage,
  PriceInfo,
  StyleTag,
} from './index';
import { UserSummary } from './user';

// 商品基本信息
export interface Product {
  id: string;
  name: string;
  description?: string;
  images: ProductImage[];
  price: PriceInfo;
  colors: ColorOption[];
  sizes: SizeOption[];
  category: ProductCategory;
  tags: StyleTag[];
  status: ProductStatus;
  designer?: UserSummary;
  stats: ProductStats;
  createdAt: string;
  updatedAt: string;
}

// 商品分类
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent?: string;
}

// 商品统计
export interface ProductStats {
  views: number;
  likes: number;
  wishes: number;
  orders: number;
}

// 商品卡片数据（用于列表展示）
export interface ProductCard {
  id: string;
  name: string;
  image: string;
  thumbImage?: string; // 缩略图/衣服平铺图，用于切换预览
  price: number;
  originalPrice?: number;
  status: ProductStatus;
  likes?: number;
  isLiked?: boolean;
  designer?: {
    name: string;
    avatar?: string;
  };
}

// 商品详情
export interface ProductDetail extends Product {
  materials?: string[];
  careInstructions?: string[];
  sizeChart?: SizeChartItem[];
  relatedProducts?: ProductCard[];
  reviews?: ProductReview[];
  reviewStats?: ReviewStats;
}

// 尺码表
export interface SizeChartItem {
  size: string;
  bust: string;
  waist: string;
  hip: string;
  length: string;
}

// 商品评价
export interface ProductReview {
  id: string;
  user: UserSummary;
  rating: number;
  content: string;
  images?: string[];
  size: string;
  color: string;
  createdAt: string;
}

// 评价统计
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// 商品搜索参数
export interface ProductSearchParams {
  keyword?: string;
  category?: string;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  status?: ProductStatus;
  sortBy?: 'newest' | 'popular' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

// AI 设计结果
export interface DesignResult {
  id: string;
  prompt: string;
  images: string[];
  style: string;
  createdAt: string;
}

// 虚拟试穿结果
export interface TryOnResult {
  id: string;
  productId: string;
  userImage: string;
  resultImage: string;
  createdAt: string;
}

// 衣橱商品
export interface ClosetItem {
  id: string;
  product: ProductCard;
  status: ProductStatus;
  purchaseDate?: string;
  orderNumber?: string;
  addedAt: string;
}

// 心愿单商品
export interface WishlistItem {
  id: string;
  product: ProductCard;
  addedAt: string;
  note?: string;
}
