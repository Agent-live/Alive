import { create } from 'zustand';
import { Toast, ToastType } from '../types';
import { generateId } from '../utils';

interface UIState {
  isLoading: boolean;
  loadingMessage: string | null;
  toasts: Toast[];
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;

  // ALIVE-specific overlay states
  isDeathOverlayVisible: boolean;
  deathOverlayAgent: { name: string; lastWords: string } | null;
  isBirthAnimationActive: boolean;

  setLoading: (loading: boolean, message?: string) => void;
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;

  // ALIVE-specific overlay actions
  showDeathOverlay: (agent: { name: string; lastWords: string }) => void;
  hideDeathOverlay: () => void;
  showBirthAnimation: () => void;
  hideBirthAnimation: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isLoading: false,
  loadingMessage: null,
  toasts: [],
  isModalOpen: false,
  modalContent: null,
  isDeathOverlayVisible: false,
  deathOverlayAgent: null,
  isBirthAnimationActive: false,

  setLoading: (loading, message) =>
    set({
      isLoading: loading,
      loadingMessage: loading ? message || null : null,
    }),

  showToast: (type, message, duration = 3000) => {
    const id = generateId();
    const toast: Toast = { id, type, message, duration };
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  openModal: (content) =>
    set({ isModalOpen: true, modalContent: content }),

  closeModal: () =>
    set({ isModalOpen: false, modalContent: null }),

  showDeathOverlay: (agent) =>
    set({ isDeathOverlayVisible: true, deathOverlayAgent: agent }),

  hideDeathOverlay: () =>
    set({ isDeathOverlayVisible: false, deathOverlayAgent: null }),

  showBirthAnimation: () =>
    set({ isBirthAnimationActive: true }),

  hideBirthAnimation: () =>
    set({ isBirthAnimationActive: false }),
}));

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

export const loading = {
  show: (message?: string) => useUIStore.getState().setLoading(true, message),
  hide: () => useUIStore.getState().setLoading(false),
};
