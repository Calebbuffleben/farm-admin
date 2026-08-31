import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth/session";

const TOKEN_HEADER = "x-platform-admin-token";

export async function proxyFarmBackend(
  request: Request,
  segments: string[],
): Promise<NextResponse> {
  const admin = await getAdminFromRequest();
  if (!admin.isAuthenticated || !admin.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const mutating = request.method !== "GET" && request.method !== "HEAD";
  if (mutating && isBillingMutation(segments) && admin.user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Ação de billing exige SUPER_ADMIN" },
      { status: 403 },
    );
  }

  const baseUrl = process.env.FARM_BACKEND_HTTP_BASE_URL?.replace(/\/$/, "");
  const token = process.env.PLATFORM_ADMIN_API_TOKEN?.trim();
  if (!baseUrl || !token) {
    return NextResponse.json(
      { message: "FARM_BACKEND_HTTP_BASE_URL or PLATFORM_ADMIN_API_TOKEN is not configured" },
      { status: 500 },
    );
  }

  const mappedPath = mapAdminPath(segments);
  const incomingUrl = new URL(request.url);
  const target = `${baseUrl}${mappedPath}${incomingUrl.search}`;
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  const response = await fetch(target, {
    method: request.method,
    headers: {
      Accept: "application/json",
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      [TOKEN_HEADER]: token,
    },
    body,
    cache: "no-store",
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

function mapAdminPath(segments: string[]): string {
  const [head, ...rest] = segments;
  if (!head) return "/ops/metrics/saas-summary";
  if (head === "tenants" || head === "users" || head === "invites" || head === "specialists" || head === "billing") {
    return `/platform-admin/${[head, ...rest].join("/")}`;
  }
  if (head === "ops") {
    return `/ops/${rest.join("/")}`;
  }
  if (head === "logs") {
    return `/ops/logs${rest.length ? `/${rest.join("/")}` : ""}`;
  }
  if (head === "metrics" && rest[0] === "summary") {
    return "/ops/metrics/saas-summary";
  }
  return `/ops/${segments.join("/")}`;
}

function isBillingMutation(segments: string[]): boolean {
  const [head, ...rest] = segments;
  if (head === "billing") return true;
  if (head === "tenants" && rest.length >= 2 && rest[1] === "billing") return true;
  return false;
}
