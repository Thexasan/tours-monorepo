import type { PartnerApplication, PartnerApplicationInput } from "@tours/types";
import { apiClient } from "./apiClient";

export const partnersApi = {
  async submit(payload: PartnerApplicationInput): Promise<PartnerApplication> {
    const { data } = await apiClient.post<PartnerApplication>("/partner-applications", payload);
    return data;
  },
  async getMy(): Promise<PartnerApplication | null> {
    const { data } = await apiClient.get<PartnerApplication | null>("/partner-applications/me");
    return data;
  },
  // Admin
  async listAll(status?: "PENDING" | "APPROVED" | "REJECTED") {
    const { data } = await apiClient.get<Array<PartnerApplication & {
      user: { id: string; email: string; fullName: string; referralCode: string; role: string };
    }>>("/admin/partner-applications", { params: status ? { status } : {} });
    return data;
  },
  async review(id: string, decision: "APPROVE" | "REJECT", rejectReason?: string) {
    const { data } = await apiClient.patch<PartnerApplication>(
      `/admin/partner-applications/${id}`,
      { decision, rejectReason },
    );
    return data;
  },
};
