"use client";

import type { UserRole } from "@tours/types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/src/shared/store/auth-store";

/**
 * Защита роута: редиректит неавторизованных на /login,
 * и пользователей с неподходящей ролью — на главную.
 * Ждёт hydration перед редиректом, чтобы не сделать ложный редирект во время SSR.
 */
export function useRequireAuth(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      const redirectTo = encodeURIComponent(pathname ?? "/");
      router.replace(`/ru/login?redirectTo=${redirectTo}`);
      return;
    }

    if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
      router.replace("/ru");
    }
  }, [allowedRoles, pathname, user, isHydrated, router]);

  return { user, isHydrated };
}
