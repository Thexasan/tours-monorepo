import type { NotificationsListResponse } from "@tours/types";
import { apiClient } from "./apiClient";

export const notificationsApi = {
  async list(): Promise<NotificationsListResponse> {
    const { data } = await apiClient.get<NotificationsListResponse>("/notifications");
    return data;
  },
  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },
  async markAllRead(): Promise<void> {
    await apiClient.patch("/notifications/read-all");
  },
};
