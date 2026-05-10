import type { Review, ReviewCreateInput, ReviewStatus } from "@tours/types";
import { apiClient } from "./apiClient";

export const reviewsApi = {
  async listPublic(params?: { tourId?: string; pageSize?: number; page?: number }): Promise<Review[]> {
    const { data } = await apiClient.get<Review[]>("/reviews", { params });
    return data;
  },
  async listMy(): Promise<Array<Review & { tour?: { id: string; slug: string; title: Record<string, string> } }>> {
    const { data } = await apiClient.get<Array<Review & { tour?: { id: string; slug: string; title: Record<string, string> } }>>("/reviews/my");
    return data;
  },
  async create(payload: ReviewCreateInput): Promise<Review> {
    const { data } = await apiClient.post<Review>("/reviews", payload);
    return data;
  },
  async listAdmin(status?: ReviewStatus): Promise<Array<Review & {
    tour?: { id: string; slug: string; title: Record<string, string>; country: string };
    userEmail?: string;
  }>> {
    const { data } = await apiClient.get<Array<Review & {
      tour?: { id: string; slug: string; title: Record<string, string>; country: string };
      userEmail?: string;
    }>>("/admin/reviews", { params: status ? { status } : {} });
    return data;
  },
  async moderate(id: string, decision: "APPROVE" | "REJECT", rejectReason?: string): Promise<Review> {
    const { data } = await apiClient.patch<Review>(`/admin/reviews/${id}`, { decision, rejectReason });
    return data;
  },
};
