"use client";

import type { AuthUser, UserRole } from "@tours/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
  setAuth: (payload: { user: AuthUser; token: string; role: UserRole }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isLoading: false,
      setLoading: (isLoading) => set({ isLoading }),
      setAuth: ({ user, token, role }) => set({ user, token, role }),
      clearAuth: () => set({ user: null, token: null, role: null }),
    }),
    {
      name: "tours-auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
      }),
    },
  ),
);

export function getAuthToken() {
  return useAuthStore.getState().token;
}
