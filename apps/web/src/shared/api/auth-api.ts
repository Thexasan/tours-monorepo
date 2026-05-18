import type {
  AuthUser, LoginRequest, RegisterRequest,
} from "@tours/types";
import { apiClient } from "./apiClient";

export const authApi = {
  async sendOtp(email: string): Promise<{ devCode?: string }> {
    const { data } = await apiClient.post<{ ok: boolean; devCode?: string }>("/auth/otp/send", { email });
    return { devCode: data.devCode };
  },

  async verifyOtp(email: string, otp: string): Promise<void> {
    await apiClient.post("/auth/otp/verify", { email, otp });
  },

  async register(payload: RegisterRequest): Promise<AuthUser> {
    const { data } = await apiClient.post<{ user: AuthUser }>("/auth/register", payload);
    return data.user;
  },

  async login(payload: LoginRequest): Promise<AuthUser> {
    const { data } = await apiClient.post<{ user: AuthUser }>("/auth/login", payload);
    return data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout").catch(() => undefined);
  },

  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>("/auth/me");
    return data;
  },
};
