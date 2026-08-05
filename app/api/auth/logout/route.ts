import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// POST /api/auth/logout
// body: { scope?: "site" | "admin" }
//   scope="site"  → 只清除站点登录（保留管理员状态）
//   scope="admin" → 只清除管理员登录（保留站点状态）
//   不传 scope   → 全部清除（兼容旧行为）
export async function POST(request: Request) {
  try {
    let scope: string | undefined;
    try {
      const body = await request.json();
      scope = body.scope;
    } catch {
      // 没有 body，使用默认行为
    }

    const session = await getSession();

    if (scope === "site") {
      session.isAuthenticated = false;
      session.username = "";
      await session.save();
    } else if (scope === "admin") {
      session.isAdmin = false;
      await session.save();
    } else {
      session.destroy();
    }

    return NextResponse.json({ success: true });
  } catch {
    // 即使解析 body 失败也销毁整个 session
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ success: true });
  }
}
