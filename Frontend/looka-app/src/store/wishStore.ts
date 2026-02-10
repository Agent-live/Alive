import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  WishCard,
  WishlistEntry,
  ProductCard,
  WishActivity,
  WishDetailExtended,
  CreateEmotionalWishRequest,
  PostActivityRequest,
} from '../types';
import { wishApi } from '../api/wishes';
import { toast } from './uiStore';

interface WishState {
  // 心愿单
  wishlist: WishlistEntry[];
  wishlistLoading: boolean;

  // 拼团列表
  groupBuys: WishCard[];
  groupBuysLoading: boolean;

  // 已加入的拼团
  joinedGroupBuys: string[];

  // 当前愿望详情
  currentWishDetail: WishDetailExtended | null;
  wishDetailLoading: boolean;

  // 愿望活动
  activities: WishActivity[];
  activitiesLoading: boolean;

  // 操作方法
  fetchWishlist: () => Promise<void>;
  addToWishlist: (product: ProductCard, note?: string) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;

  fetchGroupBuys: (params?: { status?: string; type?: string }) => Promise<void>;
  joinGroupBuy: (wishId: string, size: string, color: string) => Promise<boolean>;
  hasJoinedGroupBuy: (wishId: string) => boolean;

  // 情感化愿望方法
  createWish: (request: CreateEmotionalWishRequest) => Promise<string>;
  fetchWishDetail: (wishId: string) => Promise<void>;
  fetchWishActivities: (wishId: string) => Promise<void>;
  postActivity: (request: PostActivityRequest) => Promise<void>;

  // 清空状态
  clearWishlist: () => void;
  clearWishDetail: () => void;
}

export const useWishStore = create<WishState>()(
  persist(
    (set, get) => ({
      // 初始状态
      wishlist: [],
      wishlistLoading: false,
      groupBuys: [],
      groupBuysLoading: false,
      joinedGroupBuys: [],
      currentWishDetail: null,
      wishDetailLoading: false,
      activities: [],
      activitiesLoading: false,

      // 获取心愿单
      fetchWishlist: async () => {
        set({ wishlistLoading: true });
        try {
          const response = await wishApi.getWishlist();
          set({
            wishlist: response.items,
            wishlistLoading: false,
          });
        } catch (error) {
          set({ wishlistLoading: false });
          console.error('Failed to fetch wishlist:', error);
        }
      },

      // 添加到心愿单
      addToWishlist: async (product, note) => {
        const { wishlist } = get();
        const exists = wishlist.some((item) => item.product.id === product.id);

        if (exists) {
          toast.info('已在心愿单中');
          return;
        }

        try {
          const entry = await wishApi.addToWishlist(product.id, note);
          set((state) => ({
            wishlist: [entry, ...state.wishlist],
          }));
          toast.success('已加入心愿单');
        } catch (error) {
          const message = error instanceof Error ? error.message : '添加失败';
          toast.error(message);
          throw error;
        }
      },

      // 从心愿单移除
      removeFromWishlist: async (id) => {
        try {
          await wishApi.removeFromWishlist(id);
          set((state) => ({
            wishlist: state.wishlist.filter((item) => item.id !== id),
          }));
          toast.success('已从心愿单移除');
        } catch (error) {
          const message = error instanceof Error ? error.message : '移除失败';
          toast.error(message);
          throw error;
        }
      },

      // 检查是否在心愿单中
      isInWishlist: (productId) => {
        return get().wishlist.some((item) => item.product.id === productId);
      },

      // 获取拼团列表
      fetchGroupBuys: async (params?: { status?: string; type?: string }) => {
        set({ groupBuysLoading: true });
        try {
          const response = await wishApi.getGroupBuys(params as import('../types').WishQueryParams);
          set({
            groupBuys: response.items,
            groupBuysLoading: false,
          });
        } catch (error) {
          set({ groupBuysLoading: false });
          console.error('Failed to fetch group buys:', error);
        }
      },

      // 加入拼团
      joinGroupBuy: async (wishId, size, color) => {
        try {
          const response = await wishApi.joinGroupBuy({ wishId, size, color });

          if (response.success) {
            set((state) => ({
              joinedGroupBuys: [...state.joinedGroupBuys, wishId],
              groupBuys: state.groupBuys.map((gb) =>
                gb.id === wishId
                  ? {
                      ...gb,
                      currentCount: response.currentCount,
                      status: response.status,
                      progress: (response.currentCount / gb.targetCount) * 100,
                    }
                  : gb
              ),
            }));
            toast.success('成功加入拼团');
            return true;
          }
          return false;
        } catch (error) {
          const message = error instanceof Error ? error.message : '加入失败';
          toast.error(message);
          return false;
        }
      },

      // 检查是否已加入拼团
      hasJoinedGroupBuy: (wishId) => {
        return get().joinedGroupBuys.includes(wishId);
      },

      // 清空心愿单状态
      clearWishlist: () => {
        set({
          wishlist: [],
          joinedGroupBuys: [],
        });
      },

      // 创建愿望
      createWish: async (_request: CreateEmotionalWishRequest) => {
        try {
          // 模拟 API 调用
          await new Promise((r) => setTimeout(r, 1000));
          const wishId = Math.random().toString(36).substring(2, 15);
          toast.success('愿望已发起！分享给朋友一起达成吧');
          return wishId;
        } catch (error) {
          const message = error instanceof Error ? error.message : '创建失败';
          toast.error(message);
          throw error;
        }
      },

      // 获取愿望详情
      fetchWishDetail: async (wishId: string) => {
        set({ wishDetailLoading: true });
        try {
          // 模拟 API 调用
          await new Promise((r) => setTimeout(r, 500));
          const mockDetail: WishDetailExtended = {
            id: wishId,
            product: {
              id: '1',
              name: '法式慵懒风针织开衫',
              image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
              price: 399,
              status: 'wishing',
            },
            type: 'standard',
            status: 'active',
            targetCount: 10,
            currentCount: 8,
            participants: [
              { id: '1', user: { id: '1', nickname: '小红', avatar: 'https://i.pravatar.cc/100?img=1' }, joinedAt: '2024-01-20', isInitiator: true },
              { id: '2', user: { id: '2', nickname: 'Amy', avatar: 'https://i.pravatar.cc/100?img=2' }, joinedAt: '2024-01-21', isInitiator: false },
            ],
            progress: 80,
            originalPrice: 599,
            groupPrice: 399,
            savings: 200,
            savingsPercent: 33,
            startAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: { id: '1', nickname: '小红', avatar: 'https://i.pravatar.cc/100?img=1' },
            remainingTime: 3 * 24 * 60 * 60,
            participantAvatars: [
              'https://i.pravatar.cc/100?img=1',
              'https://i.pravatar.cc/100?img=2',
              'https://i.pravatar.cc/100?img=3',
            ],
            description: '一起拥有这件温柔的针织开衫',
            tryOnImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
            rules: ['达到10人即可成团', '成团后7-14天发货', '支持7天无理由退换'],
            milestones: [
              { count: 5, discount: 25, reached: true, reachedAt: '2024-01-20' },
              { count: 10, discount: 33, reached: false },
            ],
            story: {
              title: '想和你一起拥有这份温柔',
              content: '第一次看到这件针织开衫就被它的设计吸引了，柔软的面料和温柔的色调，适合任何场合穿着。希望能和大家一起，把这份温柔带回家。',
              emotion: 'hopeful',
            },
            activities: [
              {
                id: '1',
                type: 'join',
                user: { id: '1', nickname: '小红', avatar: 'https://i.pravatar.cc/100?img=1' },
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: '2',
                type: 'comment',
                user: { id: '2', nickname: '穿搭达人Amy', avatar: 'https://i.pravatar.cc/100?img=2' },
                content: '这件好好看！已经迫不及待想收到了',
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: '3',
                type: 'milestone',
                user: { id: 'system', nickname: '系统' },
                content: '🎉 已达成5人里程碑！解锁25%折扣',
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            emotionalMilestones: [
              {
                id: '1',
                count: 3,
                title: '愿望萌芽',
                icon: '🌱',
                reached: true,
                reachedAt: '2024-01-18',
              },
              {
                id: '2',
                count: 5,
                title: '小有名气',
                icon: '✨',
                reached: true,
                reachedAt: '2024-01-20',
              },
              {
                id: '3',
                count: 8,
                title: '即将达成',
                icon: '🔥',
                reached: true,
                reachedAt: '2024-01-22',
              },
              {
                id: '4',
                count: 10,
                title: '梦想成真',
                icon: '🎉',
                reached: false,
              },
            ],
          };
          set({
            currentWishDetail: mockDetail,
            wishDetailLoading: false,
            activities: mockDetail.activities,
          });
        } catch (error) {
          set({ wishDetailLoading: false });
          console.error('Failed to fetch wish detail:', error);
        }
      },

      // 获取愿望活动
      fetchWishActivities: async (_wishId: string) => {
        set({ activitiesLoading: true });
        try {
          await new Promise((r) => setTimeout(r, 300));
          // 活动已在 fetchWishDetail 中获取
          set({ activitiesLoading: false });
        } catch (error) {
          set({ activitiesLoading: false });
          console.error('Failed to fetch activities:', error);
        }
      },

      // 发布活动
      postActivity: async (request: PostActivityRequest) => {
        try {
          const newActivity: WishActivity = {
            id: Math.random().toString(36).substring(2, 15),
            type: request.type,
            user: { id: 'current-user', nickname: '我' },
            content: request.content,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            activities: [newActivity, ...state.activities],
          }));
          if (request.type === 'comment') {
            toast.success('评论已发送');
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : '发送失败';
          toast.error(message);
        }
      },

      // 清空愿望详情
      clearWishDetail: () => {
        set({
          currentWishDetail: null,
          activities: [],
        });
      },
    }),
    {
      name: 'wish-storage',
      partialize: (state) => ({
        joinedGroupBuys: state.joinedGroupBuys,
      }),
    }
  )
);
