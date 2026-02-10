import { create } from 'zustand';
import { Toast, ToastType } from '../types';
import { generateId } from '../utils';

interface UIState {
  // 全局加载状态
  isLoading: boolean;
  loadingMessage: string | null;

  // Toast 消息
  toasts: Toast[];

  // 模态框
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;

  // 操作方法
  setLoading: (loading: boolean, message?: string) => void;
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // 初始状态
  isLoading: false,
  loadingMessage: null,
  toasts: [],
  isModalOpen: false,
  modalContent: null,

  // 设置全局加载状态
  setLoading: (loading, message) =>
    set({
      isLoading: loading,
      loadingMessage: loading ? message || null : null,
    }),

  // 显示 Toast
  showToast: (type, message, duration = 3000) => {
    const id = generateId();
    const toast: Toast = { id, type, message, duration };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  // 移除 Toast
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // 清空所有 Toast
  clearToasts: () => set({ toasts: [] }),

  // 打开模态框
  openModal: (content) =>
    set({
      isModalOpen: true,
      modalContent: content,
    }),

  // 关闭模态框
  closeModal: () =>
    set({
      isModalOpen: false,
      modalContent: null,
    }),
}));

// 便捷的 toast 方法
export const toast = {
  success: (message: string, duration?: number) =>
    useUIStore.getState().showToast('success', message, duration),
  error: (message: string, duration?: number) =>
    useUIStore.getState().showToast('error', message, duration),
  warning: (message: string, duration?: number) =>
    useUIStore.getState().showToast('warning', message, duration),
  info: (message: string, duration?: number) =>
    useUIStore.getState().showToast('info', message, duration),
};

// 便捷的 loading 方法
export const loading = {
  show: (message?: string) => useUIStore.getState().setLoading(true, message),
  hide: () => useUIStore.getState().setLoading(false),
};
