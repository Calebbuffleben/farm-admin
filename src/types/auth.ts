export type AdminRoleValue = "SUPER_ADMIN" | "ADMIN";

export interface AdminPublicUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRoleValue;
}

export interface SessionSnapshot {
  isAuthenticated: boolean;
  user: AdminPublicUser | null;
}
