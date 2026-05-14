export type BookingStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "PAID"
  | "COMPLETED"
  | "CANCELLED";

export interface Booking {
  id: string;
  tourId: string;
  userId: string | null;

  contactName: string;
  contactEmail: string;
  contactPhone: string;

  guestsCount: number;
  preferredDate: string | null;
  notes: string | null;

  totalPriceUsd: number;
  status: BookingStatus;

  referrerId: string | null;

  paidAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface BookingCreateInput {
  tourId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  guestsCount?: number;
  preferredDate?: string;
  roomType?: string;
  notes?: string;
}

export interface BookingUpdateStatusInput {
  status: BookingStatus;
  cancelReason?: string;
  managerNotes?: string;
}
