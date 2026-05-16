import type { BookingDocument, BookingDocumentKind, BookingStatusHistoryEntry, Booking } from "@tours/types";
import { apiClient } from "./apiClient";

export interface BookingDetail extends Booking {
  tour: {
    id: string;
    slug: string;
    title: Record<string, string>;
    coverImage?: string | null;
    country?: string | null;
  } | null;
  user: { id: string; email: string; fullName?: string | null } | null;
  documents: BookingDocument[];
  statusHistory: BookingStatusHistoryEntry[];
}

export const bookingDocumentsApi = {
  async getDetail(bookingId: string): Promise<BookingDetail> {
    const { data } = await apiClient.get<BookingDetail>(`/bookings/${bookingId}`);
    return data;
  },

  async requestDocuments(bookingId: string, note?: string): Promise<void> {
    await apiClient.post(`/bookings/${bookingId}/transitions/request-documents`, { note });
  },

  async confirmDocuments(bookingId: string): Promise<void> {
    await apiClient.post(`/bookings/${bookingId}/transitions/confirm-documents`);
  },

  async rejectDocuments(bookingId: string, rejectionNote: string): Promise<void> {
    await apiClient.post(`/bookings/${bookingId}/transitions/reject-documents`, { rejectionNote });
  },

  async uploadDocument(
    bookingId: string,
    file: File,
    kind: BookingDocumentKind,
    description?: string,
  ): Promise<BookingDocument> {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    if (description) form.append("description", description);
    const { data } = await apiClient.post<BookingDocument>(`/bookings/${bookingId}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async deleteDocument(bookingId: string, docId: string): Promise<void> {
    await apiClient.delete(`/bookings/${bookingId}/documents/${docId}`);
  },

  getDownloadUrl(bookingId: string, docId: string): string {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    return `${base}/bookings/${bookingId}/documents/${docId}/download`;
  },
};
