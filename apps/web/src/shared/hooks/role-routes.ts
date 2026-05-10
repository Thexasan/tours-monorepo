import type { UserRole } from "@tours/types";

/** Дефолтная посадочная страница после логина по роли пользователя. */
export function getRoleHome(role: UserRole, locale: string): string {
  switch (role) {
    case "ADMIN":
      return `/${locale}/admin/tours`;
    case "PARTNER":
      return `/${locale}/partner/dashboard`;
    default:
      return `/${locale}/dashboard/profile`;
  }
}
