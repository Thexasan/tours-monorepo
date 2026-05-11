import type { UserRole } from "@tours/types";
import { apiClient } from "./apiClient";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  referralCode: string;
  referralCount: number;
  freeToursAvailable: number;
  balance: number;
  isPartnerApproved: boolean;
  createdAt: string;
  _count: { bookings: number; reviews: number };
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export const adminUsersApi = {
  list: async (params?: {
    search?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AdminUsersResponse> => {
    const { data } = await apiClient.get<AdminUsersResponse>("/admin/users", { params });
    return data;
  },
};
