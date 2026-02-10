import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Design,
  DesignCard,
  DesignParameters,
  DesignVersion,
  ReferenceImage,
  DesignStatus,
} from '../types';
import { toast } from './uiStore';

interface DesignState {
  // 当前编辑的设计
  currentDesign: Design | null;
  currentVersion: DesignVersion | null;

  // 草稿箱
  drafts: DesignCard[];
  draftsLoading: boolean;

  // 我的设计
  myDesigns: DesignCard[];
  myDesignsLoading: boolean;

  // 操作方法
  createDesign: (
    name: string,
    prompt: string,
    parameters: DesignParameters,
    references?: ReferenceImage[]
  ) => Promise<Design>;
  updateDesign: (id: string, updates: Partial<Design>) => Promise<void>;
  saveDraft: () => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;

  // 版本管理
  createVersion: (recipe: DesignVersion['recipe']) => Promise<DesignVersion>;
  switchVersion: (versionId: string) => void;

  // Remix
  remixDesign: (sourceDesignId: string) => Promise<Design>;

  // 状态管理
  setCurrentDesign: (design: Design | null) => void;
  clearCurrentDesign: () => void;

  // 数据获取
  fetchDrafts: () => Promise<void>;
  fetchMyDesigns: () => Promise<void>;
}

// 模拟生成唯一 ID
const generateId = () => Math.random().toString(36).substring(2, 15);

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentDesign: null,
      currentVersion: null,
      drafts: [],
      draftsLoading: false,
      myDesigns: [],
      myDesignsLoading: false,

      // 创建设计
      createDesign: async (name, prompt, parameters, references = []) => {
        const now = new Date().toISOString();
        const designId = generateId();
        const versionId = generateId();
        const recipeId = generateId();

        const recipe = {
          id: recipeId,
          prompt,
          parameters,
          references,
          createdAt: now,
        };

        const version: DesignVersion = {
          id: versionId,
          designId,
          recipe,
          images: [], // 待生成
          createdAt: now,
        };

        const design: Design = {
          id: designId,
          name,
          status: 'draft' as DesignStatus,
          currentVersion: version,
          versions: [version],
          creator: {
            id: 'current-user',
            nickname: '我',
          },
          stats: {
            views: 0,
            likes: 0,
            remixes: 0,
            shares: 0,
          },
          createdAt: now,
          updatedAt: now,
        };

        set({
          currentDesign: design,
          currentVersion: version,
        });

        toast.success('设计已创建');
        return design;
      },

      // 更新设计
      updateDesign: async (id, updates) => {
        const { currentDesign } = get();
        if (currentDesign && currentDesign.id === id) {
          set({
            currentDesign: {
              ...currentDesign,
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      // 保存草稿
      saveDraft: async () => {
        const { currentDesign, drafts } = get();
        if (!currentDesign) {
          toast.error('没有可保存的设计');
          return;
        }

        const draftCard: DesignCard = {
          id: currentDesign.id,
          name: currentDesign.name,
          image: currentDesign.currentVersion?.images[0] || '',
          status: 'draft',
          creator: currentDesign.creator,
          stats: currentDesign.stats,
          createdAt: currentDesign.createdAt,
        };

        const existingIndex = drafts.findIndex((d) => d.id === currentDesign.id);
        if (existingIndex >= 0) {
          const newDrafts = [...drafts];
          newDrafts[existingIndex] = draftCard;
          set({ drafts: newDrafts });
        } else {
          set({ drafts: [draftCard, ...drafts] });
        }

        toast.success('已保存到草稿箱');
      },

      // 删除草稿
      deleteDraft: async (id) => {
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
        }));
        toast.success('草稿已删除');
      },

      // 创建新版本
      createVersion: async (recipe) => {
        const { currentDesign } = get();
        if (!currentDesign) {
          throw new Error('No current design');
        }

        const newVersion: DesignVersion = {
          id: generateId(),
          designId: currentDesign.id,
          recipe,
          images: [],
          createdAt: new Date().toISOString(),
          parentVersionId: currentDesign.currentVersion?.id,
        };

        set({
          currentDesign: {
            ...currentDesign,
            currentVersion: newVersion,
            versions: [...currentDesign.versions, newVersion],
            updatedAt: new Date().toISOString(),
          },
          currentVersion: newVersion,
        });

        return newVersion;
      },

      // 切换版本
      switchVersion: (versionId) => {
        const { currentDesign } = get();
        if (!currentDesign) return;

        const version = currentDesign.versions.find((v) => v.id === versionId);
        if (version) {
          set({
            currentDesign: {
              ...currentDesign,
              currentVersion: version,
            },
            currentVersion: version,
          });
        }
      },

      // Remix 设计
      remixDesign: async (_sourceDesignId) => {
        // 模拟获取源设计并创建副本
        const now = new Date().toISOString();
        const designId = generateId();

        const remixedDesign: Design = {
          id: designId,
          name: 'Remix 设计',
          status: 'draft',
          currentVersion: {
            id: generateId(),
            designId,
            recipe: {
              id: generateId(),
              prompt: '',
              parameters: {
                style: '',
                fabric: '',
                scenario: '',
                budget: { min: 0, max: 1000 },
                fit: '',
                intensity: 50,
              },
              references: [],
              createdAt: now,
            },
            images: [],
            createdAt: now,
          },
          versions: [],
          creator: {
            id: 'current-user',
            nickname: '我',
          },
          stats: {
            views: 0,
            likes: 0,
            remixes: 0,
            shares: 0,
          },
          createdAt: now,
          updatedAt: now,
        };

        remixedDesign.versions = [remixedDesign.currentVersion];

        set({
          currentDesign: remixedDesign,
          currentVersion: remixedDesign.currentVersion,
        });

        toast.success('已创建 Remix');
        return remixedDesign;
      },

      // 设置当前设计
      setCurrentDesign: (design) => {
        set({
          currentDesign: design,
          currentVersion: design?.currentVersion || null,
        });
      },

      // 清除当前设计
      clearCurrentDesign: () => {
        set({
          currentDesign: null,
          currentVersion: null,
        });
      },

      // 获取草稿列表
      fetchDrafts: async () => {
        set({ draftsLoading: true });
        // 模拟 API 调用
        await new Promise((r) => setTimeout(r, 500));
        set({ draftsLoading: false });
      },

      // 获取我的设计
      fetchMyDesigns: async () => {
        set({ myDesignsLoading: true });
        // 模拟 API 调用
        await new Promise((r) => setTimeout(r, 500));
        set({ myDesignsLoading: false });
      },
    }),
    {
      name: 'design-storage',
      partialize: (state) => ({
        drafts: state.drafts,
        currentDesign: state.currentDesign,
      }),
    }
  )
);
