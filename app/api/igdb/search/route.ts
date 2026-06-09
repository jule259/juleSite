import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { searchIGDB } from "@/lib/igdb";

// GET /api/igdb/search?q=Elden Ring
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 1) {
    return NextResponse.json({ error: "请输入搜索关键词" }, { status: 400 });
  }

  try {
    const results = await searchIGDB(q);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "IGDB 搜索失败";
    console.error("IGDB search error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
