export const SESSION_COOKIE = "farm_admin_session";

export const ARGON2_OPTIONS = Object.freeze({
  type: 2 as const,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
});

export const DEFAULT_JWT_TTL_SECONDS = 8 * 60 * 60; // 8 hours
export const DEFAULT_REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export const JWT_ISSUER = "farm-dashboard-admin";
export const JWT_AUDIENCE = "farm-dashboard-admin";
