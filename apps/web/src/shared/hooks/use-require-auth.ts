"use client";

import type { UserRole } from "@tours/types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/src/shared/store/auth-store";
import { getRoleHome } from "@/src/shared/hooks/role-routes";

/**
 * Защита роута: редиректит неавторизованных на /login,
 * и пользователей с неподходящей ролью — на их домашнюю страницу.
 * Ждёт hydration перед редиректом, чтобы не сделать ложный редирект во время SSR.
 */
export function useRequireAuth(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    // Извлекаем локаль из pathname (/ru/..., /en/...) — первый сегмент
    const locale = pathname?.split("/")?.[1] ?? "ru";

    if (!user) {
      const redirectTo = encodeURIComponent(pathname ?? "/");
      router.replace(`/${locale}/login?redirectTo=${redirectTo}`);
      return;
    }

    if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
      // Редиректим на домашнюю страницу реальной роли, а не просто на главную
      router.replace(getRoleHome(user.role, locale));
    }
  }, [allowedRoles, pathname, user, isHydrated, router]);

  return { user, isHydrated };
}
