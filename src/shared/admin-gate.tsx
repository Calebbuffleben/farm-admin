"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/shared/auth-context";

/** All users in the admin DB are operators; gate ensures session is present. */
export function AdminGate({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session.user) {
    return null;
  }
  return <>{children}</>;
}
