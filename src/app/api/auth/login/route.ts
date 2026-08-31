import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim();
    const password = body.password;
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }
    const snapshot = await loginAdmin(email, password);
    return NextResponse.json(snapshot);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Authentication failed";
    const status = message.includes("Invalid") ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
