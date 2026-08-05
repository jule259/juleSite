import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// POST /api/auth/login — 站点登录（用户名+密码 → isAuthenticated）
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 });
    }

    const siteUsername = process.env.SITE_USERNAME ?? "admin";
    const sitePassword = process.env.SITE_PASSWORD ?? "admin123";

    if (username !== siteUsername || password !== sitePassword) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const session = await getSession();
    session.isAuthenticated = true;
    session.username = username;
    // 注意：不设置 isAdmin，管理员权限需要单独登录
    await session.save();

    return NextResponse.json({ success: true, username });
  } catch {
    return NextResponse.json({ error: "请求无效" }, { status: 400 });
  }
}
