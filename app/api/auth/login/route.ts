import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

    if (password !== adminPassword) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    const session = await getSession();
    session.isAdmin = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "请求无效" }, { status: 400 });
  }
}
