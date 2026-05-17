// Auth-related shapes (matches NestJS DTO output)

// String literal версия Prisma UserRole — для использования на фронте без зависимости от @prisma/client
export type UserRole = "GUEST" | "CLIENT" | "PARTNER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  referralCode: string;
  referralCount: number;
  freeToursAvailable: number;
  balance: number;
  commissionRate: number;
  isPartnerApproved: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  referralCode?: string;
  otp: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  // refreshToken — в httpOnly cookie, во фронт не отдаётся в JSON
}
