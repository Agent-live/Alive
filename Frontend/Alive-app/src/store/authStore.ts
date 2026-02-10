import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi } from '../api/auth';
import { userApi } from '../api/user';
import { tokenStorage, userStorage } from '../utils/storage';
import { toast } from './uiStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;

  login: (phone: string, code: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  setOnboardingComplete: (completed: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasCompletedOnboarding: false,

      login: async (phone, code) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ phone, code });
          const { user, token } = response;
          tokenStorage.set(token);
          userStorage.set(user);
          set({ user, token, isAuthenticated: true, isLoading: false });
          toast.success('Login successful');
          return true;
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : 'Login failed';
          toast.error(message);
          return false;
        }
      },

      logout: () => {
        tokenStorage.remove();
        userStorage.remove();
        set({ user: null, token: null, isAuthenticated: false });
        toast.success('Logged out');
      },

      checkAuth: async () => {
        const token = tokenStorage.get();
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }
        try {
          const user = await userApi.getCurrentUser();
          set({ user, token, isAuthenticated: true });
        } catch {
          tokenStorage.remove();
          userStorage.remove();
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      updateUser: async (data) => {
        const { user } = get();
        if (!user) return;
        try {
          const updatedUser = await userApi.updateUser(data);
          userStorage.set(updatedUser);
          set({ user: updatedUser });
          toast.success('Profile updated');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Update failed';
          toast.error(message);
          throw error;
        }
      },

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

export const auth = {
  isLoggedIn: () => useAuthStore.getState().isAuthenticated,
  getUser: () => useAuthStore.getState().user,
  getToken: () => useAuthStore.getState().token,
};
