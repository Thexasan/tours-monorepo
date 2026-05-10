// @tours/db — Public API
// Используется во всём монорепо. Из NestJS импортируем prisma client + типы.

export { PrismaClient, Prisma } from "@prisma/client";

// Re-export всех enum'ов из Prisma для удобства
export {
  UserRole,
  BookingStatus,
  ReviewStatus,
  MealPlan,
  PartnerApplicationStatus,
  PayoutStatus,
  TransactionType,
} from "@prisma/client";

// Re-export всех модельных типов из Prisma
export type {
  User,
  Tour,
  Booking,
  Review,
  Photo,
  ReferralClick,
  PartnerApplication,
  Payout,
  Transaction,
  RefreshToken,
} from "@prisma/client";

import { PrismaClient } from "@prisma/client";

// Singleton для предотвращения множественных подключений в dev (HMR)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
