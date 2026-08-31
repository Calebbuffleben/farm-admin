import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/constants";

const isProd = process.env.NODE_ENV === "production";

export async function readSessionCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export async function setSessionCookie(
  accessToken: string,
  maxAgeSeconds: number,
): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
