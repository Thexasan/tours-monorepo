import type { Payout, PayoutRequestInput } from "@tours/types";
import { apiClient } from "./apiClient";

export const payoutsApi = {
  async request(payload: PayoutRequestInput): Promise<Payout> {
    const { data } = await apiClient.post<Payout>("/payouts", payload);
    return data;
  },
  async listMy(): Promise<Payout[]> {
    const { data } = await apiClient.get<Payout[]>("/payouts/my");
    return data;
  },
  async listAll(status?: "REQUESTED" | "PROCESSING" | "PAID" | "REJECTED") {
    const { data } = await apiClient.get<Array<Payout & {
      user: { id: string; email: string; fullName: string; role: string };
    }>>("/admin/payouts", { params: status ? { status } : {} });
    return data;
  },
  async process(id: string, decision: "APPROVE" | "REJECT", opts?: { externalRef?: string; rejectReason?: string }) {
    const { data } = await apiClient.patch<Payout>(`/admin/payouts/${id}`, { decision, ...opts });
    return data;
  },
};
