import { apiClient } from "./apiClient";

export interface AdminPartner {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "PARTNER";
  referralCode: string;
  balance: number;
  commissionRate: number;
  isActive: boolean;
  isPartnerApproved: boolean;
  referralsCount?: number;
  createdAt: string;
}

export interface AdminPartnerListResponse {
  items: AdminPartner[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreatePartnerPayload {
  email: string;
  fullName: string;
  phone?: string;
  commissionRate?: number;
}

export interface UpdatePartnerPayload {
  fullName?: string;
  phone?: string;
  isActive?: boolean;
  commissionRate?: number;
}

export const adminPartnersApi = {
  async list(params?: { search?: string; page?: number; pageSize?: number }): Promise<AdminPartnerListResponse> {
    const { data } = await apiClient.get<AdminPartnerListResponse>("/admin/partners", { params });
    return data;
  },
  async create(payload: CreatePartnerPayload): Promise<AdminPartner> {
    const { data } = await apiClient.post<AdminPartner>("/admin/partners", payload);
    return data;
  },
  async update(id: string, payload: UpdatePartnerPayload): Promise<AdminPartner> {
    const { data } = await apiClient.patch<AdminPartner>(`/admin/partners/${id}`, payload);
    return data;
  },
  async resetPassword(id: string): Promise<{ ok: boolean }> {
    const { data } = await apiClient.post<{ ok: boolean }>(`/admin/partners/${id}/reset-password`);
    return data;
  },
};
