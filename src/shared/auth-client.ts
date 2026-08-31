import type { SessionSnapshot } from "@/types/auth";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) message = payload.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function fetchSession(): Promise<SessionSnapshot> {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 401) {
    return { isAuthenticated: false, user: null };
  }
  return parseJson<SessionSnapshot>(response);
}

export async function loginAdmin(input: {
  email: string;
  password: string;
}): Promise<SessionSnapshot> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<SessionSnapshot>(response);
}

export async function logoutAdmin(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    await parseJson(response);
  }
}
