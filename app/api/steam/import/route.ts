import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/steam/import
// Body: { games: [{ title, steamAppId, coverImageUrl, playTimeHours, developer, publisher, genres }] }
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const importGames: Array<{
      title: string;
      steamAppId: string;
      coverImageUrl?: string;
      playTimeHours?: number;
      developer?: string;
      publisher?: string;
      genres?: string[];
    }> = body.games;

    if (!Array.isArray(importGames) || importGames.length === 0) {
      return NextResponse.json({ error: "请提供要导入的游戏列表" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (const game of importGames) {
      // Skip if already imported (by steamAppId)
      const existing = await prisma.game.findFirst({
        where: { steamAppId: game.steamAppId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.game.create({
        data: {
          title: game.title,
          platforms: ["PC"],
          genres: game.genres ?? [],
          status: "backlog",
          playTimeHours: game.playTimeHours ?? null,
          developer: game.developer ?? null,
          publisher: game.publisher ?? null,
          steamAppId: game.steamAppId,
          coverImageUrl: game.coverImageUrl ?? null,
        },
      });

      imported++;
    }

    return NextResponse.json({
      imported,
      skipped,
      total: importGames.length,
      message: `成功导入 ${imported} 款游戏${skipped > 0 ? `，跳过 ${skipped} 款（已存在）` : ""}`,
    });
  } catch (error) {
    console.error("导入游戏失败:", error);
    return NextResponse.json({ error: "导入游戏失败" }, { status: 500 });
  }
}
