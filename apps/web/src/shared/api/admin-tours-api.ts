import type { Tour } from "@tours/types";
import { apiClient } from "./apiClient";

export interface AdminTourCreatePayload {
  slug: string;
  title: { ru: string; en?: string; tj?: string };
  description: { ru: string; en?: string; tj?: string };
  programIncluded?: { ru: string; en?: string; tj?: string }[];
  programExcluded?: { ru: string; en?: string; tj?: string }[];
  country: string;
  city?: string;
  hotelName?: string;
  hotelStars?: number;
  mealPlan?: "ALL_INCLUSIVE" | "HALF_BOARD" | "BREAKFAST" | "NO_MEALS";
  durationDays?: number;
  priceUsd: number;
  coverImage: string;
  images?: string[];
  isHot?: boolean;
  referralThreshold?: number;
}

export const adminToursApi = {
  list: async (includeInactive = true): Promise<Tour[]> => {
    const { data } = await apiClient.get<Tour[]>("/admin/tours", {
      params: { includeInactive: includeInactive ? "true" : "false" },
    });
    return data;
  },
  create: async (payload: AdminTourCreatePayload): Promise<Tour> => {
    const { data } = await apiClient.post<Tour>("/admin/tours", payload);
    return data;
  },
  update: async (id: string, payload: Partial<AdminTourCreatePayload> & { isActive?: boolean }): Promise<Tour> => {
    const { data } = await apiClient.patch<Tour>(`/admin/tours/${id}`, payload);
    return data;
  },
  archive: async (id: string): Promise<Tour> => {
    const { data } = await apiClient.delete<Tour>(`/admin/tours/${id}`);
    return data;
  },
};
