import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { AdminRole } from "@/generated/prisma";
import {
  DEFAULT_JWT_TTL_SECONDS,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from "@/lib/auth/constants";

export interface AdminAccessClaims {
  sub: string;
  email: string;
  role: AdminRole;
  sid: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_JWT_SECRET must be set and at least 32 characters long.",
    );
  }
  return new TextEncoder().encode(secret);
}

export function accessTtlSeconds(): number {
  const raw = process.env.ADMIN_JWT_TTL_SECONDS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_JWT_TTL_SECONDS;
  return Number.isFinite(parsed) && parsed > 60 ? parsed : DEFAULT_JWT_TTL_SECONDS;
}

export async function signAccessToken(
  claims: Omit<AdminAccessClaims, "sid"> & { sid: string },
): Promise<string> {
  const ttl = accessTtlSeconds();
  return new SignJWT({
    email: claims.email,
    role: claims.role,
    sid: claims.sid,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey());
}

export async function verifyAccessToken(
  token: string,
): Promise<AdminAccessClaims> {
  const { payload } = await jwtVerify(token, secretKey(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  const sub = payload.sub;
  const email = payload.email;
  const role = payload.role;
  const sid = payload.sid;
  if (
    typeof sub !== "string" ||
    typeof email !== "string" ||
    (role !== "ADMIN" && role !== "SUPER_ADMIN") ||
    typeof sid !== "string"
  ) {
    throw new Error("Invalid token claims");
  }
  return { sub, email, role, sid };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
