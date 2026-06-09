import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSteamLibrary, convertSteamGames } from "@/lib/steam";

// GET /api/steam/library?steamId=7656119...
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const steamId = request.nextUrl.searchParams.get("steamId");
  if (!steamId) {
    return NextResponse.json({ error: "请提供 Steam ID" }, { status: 400 });
  }

  try {
    const rawGames = await getSteamLibrary(steamId);
    const games = await convertSteamGames(rawGames);
    return NextResponse.json({ games, total: games.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取 Steam 游戏库失败";
    console.error("Steam API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
