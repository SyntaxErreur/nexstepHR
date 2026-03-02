import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  impersonating: User | null;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  impersonate: (user: User) => void;
  stopImpersonating: () => void;
}

const savedUser = (() => {
  try {
    const raw = localStorage.getItem('nexstep_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
})();

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser,
  isAuthenticated: !!savedUser,
  isLoading: false,
  impersonating: null,

  login: (user: User) => {
    localStorage.setItem('nexstep_auth_user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('nexstep_auth_user');
    set({ user: null, isAuthenticated: false, impersonating: null });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  impersonate: (user: User) => set((state) => ({
    impersonating: state.user,
    user,
    isAuthenticated: true,
  })),

  stopImpersonating: () => set((state) => ({
    user: state.impersonating,
    impersonating: null,
  })),
}));

// Helper to get the effective user (handles impersonation)
export function useCurrentUser(): User | null {
  return useAuthStore(state => state.user);
}
