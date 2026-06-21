import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { api } from '@/api';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: async (username: string, password: string) => {
        const { token, user } = await api.login(username, password);
        set({ token, user });
      },
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'teleconsult-auth' },
  ),
);
