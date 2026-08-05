import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET /api/auth/me — 返回当前会话状态
export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    isAuthenticated: session.isAuthenticated === true,
    username: session.username ?? null,
    isAdmin: session.isAdmin === true,
  });
}
