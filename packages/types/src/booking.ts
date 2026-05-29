export type BookingStatus =
  | "NEW"
  | "DOCUMENTS_REQUESTED"
  | "DOCUMENTS_SUBMITTED"
  | "IN_PROGRESS"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "COMPLETED"
  | "CANCELLED";

export type BookingDocumentKind =
  | "PASSPORT_INTERNAL"
  | "PASSPORT_FOREIGN"
  | "PAYMENT_RECEIPT"
  | "OTHER";

export interface PaymentDetails {
  bankName: string;
  cardNumber: string;
  instructions: string;
  amount: number;
}

export interface BookingDocument {
  id: string;
  bookingId: string;
  kind: BookingDocumentKind;
  uploadedById: string | null;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  description: string | null;
  visibleToClient: boolean;
  confirmedAt: string | null;
  confirmedById: string | null;
  rejectionNote: string | null;
  createdAt: string;
}

export interface BookingStatusHistoryEntry {
  id: string;
  bookingId: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  changedById: string | null;
  note: string | null;
  createdAt: string;
}

export interface BookingDocumentUploadInput {
  kind: BookingDocumentKind;
  description?: string;
}

export interface Booking {
  id: string;
  tourId: string;
  userId: string | null;

  contactName: string;
  contactEmail: string;
  contactPhone: string;

  guestsCount: number;
  preferredDate: string | null;
  roomType: string | null;
  notes: string | null;

  totalPriceUsd: number;
  status: BookingStatus;
  paymentDetails: PaymentDetails | null;

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
  referralCode?: string;
}

export interface BookingUpdateStatusInput {
  status: BookingStatus;
  cancelReason?: string;
  managerNotes?: string;
}

export type NotificationType =
  | "BOOKING_ACCEPTED"
  | "BOOKING_DOCUMENTS_REQUESTED"
  | "BOOKING_DOCUMENTS_CONFIRMED"
  | "BOOKING_DOCUMENTS_REJECTED"
  | "BOOKING_PAYMENT_REQUESTED"
  | "BOOKING_PAID"
  | "BOOKING_COMPLETED"
  | "BOOKING_CANCELLED"
  | "COMMISSION_EARNED"
  | "PAYOUT_PROCESSED"
  | "PAYOUT_REJECTED"
  | "WISHLIST_PRICE_DROP";

export interface NotificationMetadata {
  tourTitle?: string;
  amount?: string | number;
  rate?: string | number;
  totalPrice?: string | number;
  newPrice?: string | number;
  rejectionNote?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
  metadata?: NotificationMetadata | null;
}

export interface NotificationsListResponse {
  items: Notification[];
  unread: number;
}
