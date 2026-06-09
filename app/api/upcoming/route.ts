import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

// GET /api/upcoming
export async function GET() {
  const games = await prisma.upcomingGame.findMany({
    orderBy: { releaseDate: "asc" },
  });

  const parsed = games.map((g) => ({
    ...g,
    platforms: JSON.parse(g.platforms),
    genres: JSON.parse(g.genres),
    screenshots: JSON.parse(g.screenshots),
  }));

  return NextResponse.json({ games: parsed });
}

// POST /api/upcoming — admin only
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const game = await prisma.upcomingGame.create({
      data: {
        title: body.title,
        titleZh: body.titleZh ?? null,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : null,
        platforms: JSON.stringify(body.platforms ?? []),
        genres: JSON.stringify(body.genres ?? []),
        price: body.price ?? null,
        summary: body.summary ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
        screenshots: JSON.stringify(body.screenshots ?? []),
        steamAppId: body.steamAppId ?? null,
        developer: body.developer ?? null,
        publisher: body.publisher ?? null,
        isInterested: body.isInterested ?? true,
      },
    });

    return NextResponse.json(
      {
        ...game,
        platforms: JSON.parse(game.platforms),
        genres: JSON.parse(game.genres),
        screenshots: JSON.parse(game.screenshots),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("创建即将发售游戏失败:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
