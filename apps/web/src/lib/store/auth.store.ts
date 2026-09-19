import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, MeResponse } from '../api/auth.api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      fetchMe: async () => {
        const { accessToken } = get();
        if (!accessToken) return;
        try {
          const user = await authApi.me(accessToken);
          set({ user });
        } catch {
          set({ user: null });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { accessToken, refreshToken } = await authApi.login(email, password);
          set({ accessToken, refreshToken, isAuthenticated: true, isLoading: false });
          await get().fetchMe();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const { accessToken } = get();
        if (accessToken) {
          await authApi.logout(accessToken).catch(() => {});
        }
        get().clear();
      },

      clear: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'scholentra-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
