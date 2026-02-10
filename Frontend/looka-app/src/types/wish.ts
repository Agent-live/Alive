import { ProductCard } from './product';
import { UserSummary } from './user';

// 心愿/拼团状态
export type WishStatus =
  | 'waiting'      // 等待更多人加入
  | 'active'       // 拼团进行中
  | 'success'      // 拼团成功
  | 'failed'       // 拼团失败
  | 'expired';     // 已过期

// 拼团类型
export type GroupBuyType = 'standard' | 'flash' | 'exclusive';

// 心愿/拼团基本信息
export interface Wish {
  id: string;
  product: ProductCard;
  type: GroupBuyType;
  status: WishStatus;
  targetCount: number;      // 目标人数
  currentCount: number;     // 当前人数
  participants: Participant[];
  originalPrice: number;
  groupPrice: number;
  savings: number;          // 节省金额
  savingsPercent: number;   // 节省百分比
  startAt: string;
  endAt: string;
  createdAt: string;
  createdBy: UserSummary;
}

// 拼团参与者
export interface Participant {
  id: string;
  user: UserSummary;
  joinedAt: string;
  isInitiator: boolean;     // 是否发起人
}

// 心愿卡片数据（用于列表展示）
export interface WishCard {
  id: string;
  product: {
    id: string;
    name: string;
    image: string;
  };
  type: GroupBuyType;
  status: WishStatus;
  targetCount: number;
  currentCount: number;
  progress: number;         // 进度百分比
  originalPrice: number;
  groupPrice: number;
  savingsPercent: number;
  endAt: string;
  remainingTime: number;    // 剩余时间（秒）
  participantAvatars: string[]; // 参与者头像列表
}

// 拼团详情
export interface WishDetail extends Wish {
  description?: string;
  rules: string[];
  milestones: GroupBuyMilestone[];
  tryOnImage?: string; // 试穿效果图
  myParticipation?: {
    joinedAt: string;
    orderId?: string;
  };
}

// 拼团里程碑
export interface GroupBuyMilestone {
  count: number;
  discount: number;
  reached: boolean;
  reachedAt?: string;
}

// 创建心愿请求
export interface CreateWishRequest {
  productId: string;
  type?: GroupBuyType;
  message?: string;
}

// 加入拼团请求
export interface JoinGroupBuyRequest {
  wishId: string;
  size: string;
  color: string;
}

// 加入拼团响应
export interface JoinGroupBuyResponse {
  success: boolean;
  participation: Participant;
  currentCount: number;
  status: WishStatus;
}

// 心愿列表查询参数
export interface WishQueryParams {
  status?: WishStatus;
  type?: GroupBuyType;
  category?: string;
  sortBy?: 'newest' | 'ending_soon' | 'popular' | 'almost_there';
  page?: number;
  pageSize?: number;
}

// 用户心愿单
export interface UserWishlist {
  items: WishlistEntry[];
  total: number;
}

// 心愿单条目
export interface WishlistEntry {
  id: string;
  product: ProductCard;
  addedAt: string;
  groupBuy?: WishCard;      // 关联的拼团（如果有）
  note?: string;
}

// 热门拼团
export interface TrendingGroupBuy {
  id: string;
  product: ProductCard;
  currentCount: number;
  targetCount: number;
  remainingTime: number;
  isHot: boolean;
}

// ============================================
// 情感化愿望系统扩展
// ============================================

// 愿望活动类型
export type WishActivityType = 'join' | 'comment' | 'like' | 'share' | 'milestone';

// 愿望活动
export interface WishActivity {
  id: string;
  type: WishActivityType;
  user: UserSummary;
  content?: string;
  createdAt: string;
}

// 愿望里程碑
export interface WishMilestone {
  id: string;
  count: number;
  title: string;
  icon: string;
  reached: boolean;
  reachedAt?: string;
  reward?: string;
}

// 愿望故事
export interface WishStory {
  title: string;
  content: string;
  emotion?: 'excited' | 'hopeful' | 'grateful' | 'dreamy';
}

// 扩展愿望详情（情感化版本）
export interface WishDetailExtended extends WishDetail {
  story?: WishStory;
  activities: WishActivity[];
  emotionalMilestones: WishMilestone[];
  designId?: string;
  production?: {
    estimatedDelivery: string;
    currentStage: string;
    progress: number;
  };
  // 添加缺失的字段以支持页面显示
  participantAvatars?: string[];
  remainingTime?: number;
  progress?: number;
}

// 创建愿望请求（情感化版本）
export interface CreateEmotionalWishRequest {
  designId: string;
  title: string;
  story?: string;
  targetCount: number;
  duration: number; // 天数
  isPublic: boolean;
}

// 愿望活动请求
export interface PostActivityRequest {
  wishId: string;
  type: WishActivityType;
  content?: string;
}
