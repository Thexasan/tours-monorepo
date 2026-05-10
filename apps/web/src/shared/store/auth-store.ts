"use client";

import { create } from "zustand";
import type { AuthUser } from "@tours/types";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isHydrated: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  clear: () => set({ user: null, isLoading: false }),
}));
