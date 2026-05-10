export type PartnerApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PayoutStatus = "REQUESTED" | "PROCESSING" | "PAID" | "REJECTED";
export type TransactionType =
  | "REFERRAL_COUNT"
  | "COMMISSION_EARNED"
  | "PAYOUT_REQUEST"
  | "PAYOUT_REJECTED"
  | "ADMIN_ADJUSTMENT";

export interface PartnerApplication {
  id: string;
  userId: string;
  motivation: string;
  socialLinks: string[];
  audienceSize: number | null;
  status: PartnerApplicationStatus;
  rejectReason: string | null;
  createdAt: string;
}

export interface PartnerApplicationInput {
  motivation: string;
  socialLinks?: string[];
  audienceSize?: number;
}

export interface PartnerStats {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  clicks: number;
  registrations: number;
  bookingsTotal: number;
  bookingsPaid: number;
  conversionRate: number;
}

export interface BankDetails {
  bank: string;
  accountNumber: string;
  swift?: string;
  beneficiary: string;
}

export interface PayoutRequestInput {
  amountUsd: number;
  bankDetails: BankDetails;
}

export interface Payout {
  id: string;
  amountUsd: number;
  status: PayoutStatus;
  bankDetails: BankDetails;
  createdAt: string;
  processedAt: string | null;
  rejectReason: string | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amountUsd: number;
  increment: number;
  description: string | null;
  bookingId: string | null;
  payoutId: string | null;
  createdAt: string;
}
