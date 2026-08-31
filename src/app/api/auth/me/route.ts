import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth/session";

export async function GET() {
  const snapshot = await getAdminFromRequest();
  if (!snapshot.isAuthenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(snapshot);
}
