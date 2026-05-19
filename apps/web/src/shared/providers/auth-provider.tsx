"use client";

import { useEffect } from "react";
import { useAuthStore } from "../store/auth-store";
import { authApi } from "../api/auth-api";
import { useCurrencyStore } from "../store/currency-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setHydrated } = useAuthStore();

  useEffect(() => {
    useCurrencyStore.persist.rehydrate();
    let cancelled = false;
    (async () => {
      try {
        const user = await authApi.me();
        if (!cancelled) setUser(user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser, setHydrated]);

  return <>{children}</>;
}
