"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth-store";
import { authApi } from "../api/auth-api";
import { extractErrorMessage } from "../api/apiClient";
import type { LoginRequest, RegisterRequest } from "@tours/types";

export function useAuth() {
  const { user, isLoading, isHydrated, setUser, setLoading, clear } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const login = useCallback(
    async (payload: LoginRequest) => {
      setLoading(true);
      try {
        const u = await authApi.login(payload);
        setUser(u);
        return u;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      setLoading(true);
      try {
        const u = await authApi.register(payload);
        setUser(u);
        return u;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    clear();
    qc.clear();
    router.push("/");
    router.refresh();
  }, [clear, qc, router]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    isHydrated,
    login,
    register,
    logout,
  };
}
