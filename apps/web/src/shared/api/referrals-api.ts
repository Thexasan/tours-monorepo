import type { UserRole } from "@tours/types";
import { apiClient } from "./apiClient";

export interface ReferralStats {
  role: UserRole;
  referralCode: string;
  referralCount: number;
  freeToursAvailable: number;
  balance: number;

  clicks: number;
  registrations: number;
  paidBookings: number;
  pendingBookings: number;

  threshold: number;
  progressPercent: number;
  remaining: number;
  conversionRate: number;
}

export interface PartnerStats {
  role: UserRole;
  balance: number;
  referralCode: string;
  totals: {
    totalClicks: number;
    totalRegistrations: number;
    totalPaidBookings: number;
    totalRevenue: number;
    totalCommission: number;
  };
  timeline: {
    clicks: { day: string; count: number }[];
    registrations: { day: string; count: number }[];
    sales: { day: string; count: number; amount: number }[];
  };
  transactions: Array<{
    id: string; type: string; amountUsd: number; increment: number;
    description: string | null; bookingId: string | null; payoutId: string | null;
    createdAt: string;
  }>;
}

export const referralsApi = {
  async stats(): Promise<ReferralStats> {
    const { data } = await apiClient.get<ReferralStats>("/referrals/stats");
    return data;
  },
  async partnerStats(): Promise<PartnerStats> {
    const { data } = await apiClient.get<PartnerStats>("/partner/stats");
    return data;
  },
};
