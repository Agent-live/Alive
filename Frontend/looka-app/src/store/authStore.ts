import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Address } from '../types';
import { authApi } from '../api/auth';
import { userApi } from '../api/user';
import { tokenStorage, userStorage } from '../utils/storage';
import { toast } from './uiStore';

interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  addresses: Address[];
  hasCompletedOnboarding: boolean;

  // 操作方法
  login: (phone: string, code: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  fetchAddresses: () => Promise<void>;
  addAddress: (data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Address>;
  updateAddress: (id: string, data: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  setOnboardingComplete: (completed: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      addresses: [],
      hasCompletedOnboarding: false,

      // 登录
      login: async (phone, code) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ phone, code });
          const { user, token } = response;

          // 保存到本地存储
          tokenStorage.set(token);
          userStorage.set(user);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success('登录成功');
          return true;
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : '登录失败';
          toast.error(message);
          return false;
        }
      },

      // 登出
      logout: () => {
        tokenStorage.remove();
        userStorage.remove();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          addresses: [],
        });
        toast.success('已退出登录');
      },

      // 检查认证状态
      checkAuth: async () => {
        const token = tokenStorage.get();
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }

        try {
          const user = await userApi.getCurrentUser();
          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch {
          // Token 无效，清除登录状态
          tokenStorage.remove();
          userStorage.remove();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      // 更新用户信息
      updateUser: async (data) => {
        const { user } = get();
        if (!user) return;

        try {
          const updatedUser = await userApi.updateUser(data);
          userStorage.set(updatedUser);
          set({ user: updatedUser });
          toast.success('个人信息已更新');
        } catch (error) {
          const message = error instanceof Error ? error.message : '更新失败';
          toast.error(message);
          throw error;
        }
      },

      // 获取地址列表
      fetchAddresses: async () => {
        try {
          const addresses = await userApi.getAddresses();
          set({ addresses });
        } catch (error) {
          console.error('Failed to fetch addresses:', error);
        }
      },

      // 添加地址
      addAddress: async (data) => {
        try {
          const address = await userApi.addAddress(data);
          set((state) => ({
            addresses: [...state.addresses, address],
          }));
          toast.success('地址添加成功');
          return address;
        } catch (error) {
          const message = error instanceof Error ? error.message : '添加失败';
          toast.error(message);
          throw error;
        }
      },

      // 更新地址
      updateAddress: async (id, data) => {
        try {
          const updatedAddress = await userApi.updateAddress(id, data);
          set((state) => ({
            addresses: state.addresses.map((addr) =>
              addr.id === id ? updatedAddress : addr
            ),
          }));
          toast.success('地址更新成功');
        } catch (error) {
          const message = error instanceof Error ? error.message : '更新失败';
          toast.error(message);
          throw error;
        }
      },

      // 删除地址
      deleteAddress: async (id) => {
        try {
          await userApi.deleteAddress(id);
          set((state) => ({
            addresses: state.addresses.filter((addr) => addr.id !== id),
          }));
          toast.success('地址已删除');
        } catch (error) {
          const message = error instanceof Error ? error.message : '删除失败';
          toast.error(message);
          throw error;
        }
      },

      // 设置默认地址
      setDefaultAddress: async (id) => {
        try {
          await userApi.setDefaultAddress(id);
          set((state) => ({
            addresses: state.addresses.map((addr) => ({
              ...addr,
              isDefault: addr.id === id,
            })),
          }));
          toast.success('已设为默认地址');
        } catch (error) {
          const message = error instanceof Error ? error.message : '设置失败';
          toast.error(message);
          throw error;
        }
      },

      // 设置 onboarding 完成状态
      setOnboardingComplete: (completed) => {
        set({ hasCompletedOnboarding: completed });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

// 便捷方法
export const auth = {
  isLoggedIn: () => useAuthStore.getState().isAuthenticated,
  getUser: () => useAuthStore.getState().user,
  getToken: () => useAuthStore.getState().token,
};
