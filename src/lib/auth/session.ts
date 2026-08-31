import type { AdminRole, AdminUser } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_REFRESH_TTL_SECONDS,
  SESSION_COOKIE,
} from "@/lib/auth/constants";
import {
  accessTtlSeconds,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from "@/lib/auth/jwt";
import { randomUUID } from "node:crypto";
import { verifyPassword } from "@/lib/auth/password";
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "@/lib/auth/cookies";

export interface AdminPublicUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
}

export interface AdminSessionSnapshot {
  isAuthenticated: boolean;
  user: AdminPublicUser | null;
}

function toPublicUser(user: AdminUser): AdminPublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function refreshTtlSeconds(): number {
  const raw = process.env.ADMIN_REFRESH_TTL_SECONDS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_REFRESH_TTL_SECONDS;
  return Number.isFinite(parsed) && parsed > 3600
    ? parsed
    : DEFAULT_REFRESH_TTL_SECONDS;
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<AdminSessionSnapshot> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user?.active) {
    throw new Error("Invalid email or password");
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    throw new Error("Invalid email or password");
  }

  const refreshHash = hashRefreshToken(randomUUID());
  const expiresAt = new Date(Date.now() + refreshTtlSeconds() * 1000);

  const session = await prisma.adminSession.create({
    data: {
      adminUserId: user.id,
      tokenHash: refreshHash,
      expiresAt,
    },
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    sid: session.id,
  });

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await setSessionCookie(accessToken, accessTtlSeconds());

  return { isAuthenticated: true, user: toPublicUser(user) };
}

export async function logoutAdmin(): Promise<void> {
  const token = await readSessionCookie();
  if (token) {
    try {
      const claims = await verifyAccessToken(token);
      await prisma.adminSession.deleteMany({ where: { id: claims.sid } });
    } catch {
      /* ignore invalid token */
    }
  }
  await clearSessionCookie();
}

export async function getAdminFromRequest(): Promise<AdminSessionSnapshot> {
  const token = await readSessionCookie();
  if (!token) {
    return { isAuthenticated: false, user: null };
  }

  try {
    const claims = await verifyAccessToken(token);
    const session = await prisma.adminSession.findUnique({
      where: { id: claims.sid },
      include: { adminUser: true },
    });
    if (!session || session.expiresAt < new Date() || !session.adminUser.active) {
      await clearSessionCookie();
      return { isAuthenticated: false, user: null };
    }
    if (
      session.adminUser.id !== claims.sub ||
      session.adminUser.email !== claims.email
    ) {
      await clearSessionCookie();
      return { isAuthenticated: false, user: null };
    }
    return {
      isAuthenticated: true,
      user: toPublicUser(session.adminUser),
    };
  } catch {
    await clearSessionCookie();
    return { isAuthenticated: false, user: null };
  }
}

export { SESSION_COOKIE };
