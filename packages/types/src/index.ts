export type UserRole = "guest" | "client" | "partner" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}
