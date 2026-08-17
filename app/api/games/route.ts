import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { normalizeGameArrays } from "@/lib/utils";

// GET /api/games?status=&platform=&genre=&year=&q=&sort=&order=&page=&pageSize=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const genre = searchParams.get("genre");
    const year = searchParams.get("year");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") ?? "updatedAt";
    const order = searchParams.get("order") ?? "desc";
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status) where.status = status;
    if (year) where.playYear = parseInt(year);

    // PostgreSQL native array filtering
    if (platform) where.platforms = { has: platform };
    if (genre) where.genres = { has: genre };
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { titleZh: { contains: q } },
        { developer: { contains: q } },
      ];
    }

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.game.count({ where }),
    ]);

    // Normalize PostgreSQL arrays (Neon adapter may return string literals)
    const normalizedGames = games.map(normalizeGameArrays);

    return NextResponse.json({
      games: normalizedGames,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/games error:", error);
    return NextResponse.json(
      { error: "数据库查询失败", detail: String(error) },
      { status: 500 },
    );
  }
}

// POST /api/games — admin only
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const game = await prisma.game.create({
      data: {
        title: body.title,
        titleZh: body.titleZh ?? null,
        platforms: body.platforms ?? [],
        genres: body.genres ?? [],
        status: body.status ?? "backlog",
        rating: body.rating ?? null,
        playTimeHours: body.playTimeHours ?? null,
        playYear: body.playYear ?? null,
        developer: body.developer ?? null,
        publisher: body.publisher ?? null,
        steamAppId: body.steamAppId ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
        screenshots: body.screenshots ?? [],
        notes: body.notes ?? null,
        isRecommended: body.isRecommended ?? false,
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("创建游戏失败:", error);
    return NextResponse.json({ error: "创建游戏失败" }, { status: 500 });
  }
}
