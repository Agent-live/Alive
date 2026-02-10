import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DesignCard, DesignStatus } from '../types';
import { toast } from './uiStore';

// 衣柜物品（包含更多信息）
export interface ClosetItem extends DesignCard {
  wishId?: string;
  orderId?: string;
  receivedAt?: string;
  wearCount?: number;
  lastWornAt?: string;
  notes?: string;
  category?: string;
  modelImage?: string;
  clothImage?: string;
}

// 进行中物品
export interface InProgressItem {
  id: string;
  name: string;
  image: string;
  modelImage?: string;
  status: 'wishing' | 'making' | 'shipping';
  wishId?: string;
  orderId?: string;
  progress: number;
  currentStage: string;
  estimatedDelivery?: string;
  createdAt: string;
  category?: string;
}

interface ClosetState {
  // 已拥有的衣服
  ownedItems: ClosetItem[];
  ownedLoading: boolean;

  // 进行中（许愿中/制作中/运输中）
  inProgressItems: InProgressItem[];
  inProgressLoading: boolean;

  // 草稿
  drafts: DesignCard[];
  draftsLoading: boolean;

  // 当前 Tab
  activeTab: 'owned' | 'in_progress' | 'drafts';

  // 操作方法
  setActiveTab: (tab: 'owned' | 'in_progress' | 'drafts') => void;
  fetchOwnedItems: () => Promise<void>;
  fetchInProgressItems: () => Promise<void>;
  fetchDrafts: () => Promise<void>;

  // 物品操作
  addToOwned: (item: ClosetItem) => void;
  removeFromOwned: (id: string) => void;
  updateWearCount: (id: string) => void;
  addNote: (id: string, note: string) => void;

  // 进行中操作
  addInProgress: (item: InProgressItem) => void;
  updateProgress: (id: string, progress: Partial<InProgressItem>) => void;
  moveToOwned: (id: string) => void;
}

// Mock 数据
const mockOwnedItems: ClosetItem[] = [
  {
    id: '1',
    name: '慵懒风针织开衫',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
    status: 'owned',
    creator: { id: '1', nickname: '我', avatar: '' },
    stats: { views: 0, likes: 0, remixes: 0, shares: 0 },
    createdAt: '2024-01-15',
    receivedAt: '2024-01-20',
    wearCount: 5,
  },
  {
    id: '2',
    name: '复古碎花连衣裙',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    status: 'owned',
    creator: { id: '1', nickname: '我', avatar: '' },
    stats: { views: 0, likes: 0, remixes: 0, shares: 0 },
    createdAt: '2024-01-10',
    receivedAt: '2024-01-18',
    wearCount: 3,
  },
];

const mockInProgressItems: InProgressItem[] = [
  {
    id: '3',
    name: '极简风白衬衫',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400',
    status: 'making',
    progress: 65,
    currentStage: '裁剪中',
    estimatedDelivery: '2024-02-15',
    createdAt: '2024-01-25',
  },
  {
    id: '4',
    name: '法式风情针织背心',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400',
    status: 'wishing',
    progress: 80,
    currentStage: '还差2人达成',
    createdAt: '2024-01-28',
  },
];

const mockDrafts: DesignCard[] = [
  {
    id: '5',
    name: '未命名设计',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
    status: 'draft',
    creator: { id: '1', nickname: '我', avatar: '' },
    stats: { views: 0, likes: 0, remixes: 0, shares: 0 },
    createdAt: '2024-01-30',
  },
];

export const useClosetStore = create<ClosetState>()(
  persist(
    (set, get) => ({
      // 初始状态
      ownedItems: [],
      ownedLoading: false,
      inProgressItems: [],
      inProgressLoading: false,
      drafts: [],
      draftsLoading: false,
      activeTab: 'owned',

      // 设置当前 Tab
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      // 获取已拥有物品
      fetchOwnedItems: async () => {
        set({ ownedLoading: true });
        // 模拟 API 调用
        await new Promise((r) => setTimeout(r, 500));
        set({
          ownedItems: mockOwnedItems,
          ownedLoading: false,
        });
      },

      // 获取进行中物品
      fetchInProgressItems: async () => {
        set({ inProgressLoading: true });
        await new Promise((r) => setTimeout(r, 500));
        set({
          inProgressItems: mockInProgressItems,
          inProgressLoading: false,
        });
      },

      // 获取草稿
      fetchDrafts: async () => {
        set({ draftsLoading: true });
        await new Promise((r) => setTimeout(r, 500));
        set({
          drafts: mockDrafts,
          draftsLoading: false,
        });
      },

      // 添加到已拥有
      addToOwned: (item) => {
        set((state) => ({
          ownedItems: [item, ...state.ownedItems],
        }));
      },

      // 从已拥有中移除
      removeFromOwned: (id) => {
        set((state) => ({
          ownedItems: state.ownedItems.filter((item) => item.id !== id),
        }));
      },

      // 更新穿着次数
      updateWearCount: (id) => {
        set((state) => ({
          ownedItems: state.ownedItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  wearCount: (item.wearCount || 0) + 1,
                  lastWornAt: new Date().toISOString(),
                }
              : item
          ),
        }));
        toast.success('已记录穿着');
      },

      // 添加备注
      addNote: (id, note) => {
        set((state) => ({
          ownedItems: state.ownedItems.map((item) =>
            item.id === id ? { ...item, notes: note } : item
          ),
        }));
      },

      // 添加进行中物品
      addInProgress: (item) => {
        set((state) => ({
          inProgressItems: [item, ...state.inProgressItems],
        }));
      },

      // 更新进度
      updateProgress: (id, progress) => {
        set((state) => ({
          inProgressItems: state.inProgressItems.map((item) =>
            item.id === id ? { ...item, ...progress } : item
          ),
        }));
      },

      // 移动到已拥有
      moveToOwned: (id) => {
        const { inProgressItems } = get();
        const item = inProgressItems.find((i) => i.id === id);
        if (item) {
          const ownedItem: ClosetItem = {
            id: item.id,
            name: item.name,
            image: item.image,
            status: 'owned' as DesignStatus,
            creator: { id: 'current-user', nickname: '我' },
            stats: { views: 0, likes: 0, remixes: 0, shares: 0 },
            createdAt: item.createdAt,
            receivedAt: new Date().toISOString(),
            wearCount: 0,
          };

          set((state) => ({
            inProgressItems: state.inProgressItems.filter((i) => i.id !== id),
            ownedItems: [ownedItem, ...state.ownedItems],
          }));

          toast.success('恭喜！衣服已到达衣柜');
        }
      },
    }),
    {
      name: 'closet-storage',
      partialize: (state) => ({
        ownedItems: state.ownedItems,
        activeTab: state.activeTab,
      }),
    }
  )
);
