import type { Booking, BookingCreateInput, BookingStatus, PaymentDetails } from "@tours/types";
import { apiClient } from "./apiClient";

export interface BookingsListResponse {
  items: Array<Booking & {
    tour?: { id: string; slug: string; title: Record<string, string>; coverImage: string; country: string };
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export const bookingsApi = {
  async create(payload: BookingCreateInput): Promise<Booking> {
    const { data } = await apiClient.post<Booking>("/bookings", payload);
    return data;
  },
  async listMy(params?: { status?: BookingStatus; page?: number; pageSize?: number }): Promise<BookingsListResponse> {
    const { data } = await apiClient.get<BookingsListResponse>("/bookings/my", { params });
    return data;
  },
  async getById(id: string): Promise<Booking> {
    const { data } = await apiClient.get<Booking>(`/bookings/${id}`);
    return data;
  },
  // Admin
  async listAll(params?: { status?: BookingStatus; search?: string; page?: number; pageSize?: number }): Promise<BookingsListResponse> {
    const { data } = await apiClient.get<BookingsListResponse>("/bookings", { params });
    return data;
  },
  async updateStatus(id: string, payload: { status: BookingStatus; cancelReason?: string; managerNotes?: string }): Promise<Booking> {
    const { data } = await apiClient.patch<Booking>(`/bookings/${id}/status`, payload);
    return data;
  },
  async requestPayment(id: string, payload: Omit<PaymentDetails, "amount"> & { amount?: number }): Promise<Booking> {
    const { data } = await apiClient.post<Booking>(`/bookings/${id}/request-payment`, payload);
    return data;
  },
  async downloadTicket(id: string): Promise<Blob> {
    const { data } = await apiClient.get(`/bookings/${id}/ticket`, { responseType: "blob" });
    return data as Blob;
  },
};
