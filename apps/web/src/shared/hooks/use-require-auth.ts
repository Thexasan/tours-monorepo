"use client";

import type { UserRole } from "@tours/types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/src/shared/store/auth-store";

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, role } = useAuthStore((state) => ({
    token: state.token,
    role: state.role,
  }));

  useEffect(() => {
    if (!token) {
      const redirectTo = encodeURIComponent(pathname ?? "/");
      router.replace(`/ru/login?redirectTo=${redirectTo}`);
      return;
    }

    if (allowedRoles?.length && (!role || !allowedRoles.includes(role))) {
      router.replace("/ru");
    }
  }, [allowedRoles, pathname, role, router, token]);
}
