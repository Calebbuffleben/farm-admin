"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SessionSnapshot } from "@/types/auth";
import {
  fetchSession,
  loginAdmin,
  logoutAdmin,
} from "@/shared/auth-client";

type SessionStatus = "loading" | "unauthenticated" | "authenticated";

interface AuthContextValue {
  status: SessionStatus;
  session: SessionSnapshot;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const UNAUTHENTICATED: SessionSnapshot = {
  isAuthenticated: false,
  user: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [session, setSession] = useState<SessionSnapshot>(UNAUTHENTICATED);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applySnapshot = useCallback((next: SessionSnapshot) => {
    if (!mountedRef.current) return;
    setSession(next);
    setStatus(next.isAuthenticated ? "authenticated" : "unauthenticated");
  }, []);

  const refresh = useCallback(async () => {
    const snapshot = await fetchSession();
    applySnapshot(snapshot);
  }, [applySnapshot]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback<AuthContextValue["login"]>(
    async (input) => {
      const snapshot = await loginAdmin(input);
      applySnapshot(snapshot);
    },
    [applySnapshot],
  );

  const logout = useCallback(async () => {
    await logoutAdmin();
    applySnapshot(UNAUTHENTICATED);
  }, [applySnapshot]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, login, logout, refresh }),
    [status, session, login, logout, refresh],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
