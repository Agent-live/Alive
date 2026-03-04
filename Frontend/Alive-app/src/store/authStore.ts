import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, SocialLoginProvider, SocialLoginRequest } from '../types';
import { authApi } from '../api/auth';
import { userApi } from '../api/user';
import { settingsApi } from '../api/settings';
import { tokenStorage, userStorage } from '../utils/storage';
import { useSettingsStore } from './settingsStore';

async function hydrateRemoteUserSettings() {
  try {
    const settings = await settingsApi.getUserSettings();
    useSettingsStore.getState().applyRemoteUserSettings(settings);
  } catch {
    // Non-fatal: keep local defaults/persistence.
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  showLoginModal: boolean;
  loginRedirectPath: string | null;

  login: (phone: string, code: string) => Promise<boolean>;
  socialLogin: (payload: SocialLoginProvider | SocialLoginRequest) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  setOnboardingComplete: (completed: boolean) => void;
  openLoginModal: (redirectPath?: string) => void;
  closeLoginModal: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      hasCompletedOnboarding: false,
      showLoginModal: false,
      loginRedirectPath: null,

      login: async (phone, code) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ phone, code });
          const { user, token } = response;
          tokenStorage.set(token);
          userStorage.set(user);
          set({ user, token, isAuthenticated: true, isLoading: false });
          void hydrateRemoteUserSettings();
          return true;
        } catch (error) {
          console.error('Login failed:', error);
          set({ isLoading: false });
          return false;
        }
      },

      socialLogin: async (payload) => {
        set({ isLoading: true });
        try {
          const request: SocialLoginRequest = typeof payload === 'string' ? { provider: payload } : payload;
          const response = await authApi.socialLogin(request);
          const { user, token } = response;
          tokenStorage.set(token);
          userStorage.set(user);
          set({ user, token, isAuthenticated: true, isLoading: false });
          void hydrateRemoteUserSettings();
          return true;
        } catch (error) {
          console.error('Social login failed:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        tokenStorage.remove();
        userStorage.remove();
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        const token = tokenStorage.get();
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null, isLoading: false });
          return;
        }
        try {
          const user = await userApi.getCurrentUser();
          set({ user, token, isAuthenticated: true, isLoading: false });
          void hydrateRemoteUserSettings();
        } catch {
          tokenStorage.remove();
          userStorage.remove();
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: async (data) => {
        const { user } = get();
        if (!user) return;
        try {
          const updatedUser = await userApi.updateUser(data);
          userStorage.set(updatedUser);
          set({ user: updatedUser });
        } catch (error) {
          console.error('Failed to update user:', error);
          throw error;
        }
      },

      setOnboardingComplete: (completed) => {
        set({ hasCompletedOnboarding: completed });
      },

      openLoginModal: (redirectPath?: string) => set({ showLoginModal: true, loginRedirectPath: redirectPath ?? null }),
      closeLoginModal: () => set({ showLoginModal: false, loginRedirectPath: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
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
