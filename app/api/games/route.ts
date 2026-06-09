import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

// GET /api/games?status=&platform=&genre=&year=&q=&sort=&order=&page=&pageSize=
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const status = searchParams.get("status");
  const platform = searchParams.get("platform");
  const genre = searchParams.get("genre");
  const year = searchParams.get("year");
  const q = searchParams.get("q"); // search query
  const sort = searchParams.get("sort") ?? "updatedAt";
  const order = searchParams.get("order") ?? "desc";
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20");

  // Build where clause
  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (year) where.playYear = parseInt(year);

  // SQLite doesn't support array contains, so we use LIKE for platform/genre
  if (platform) {
    where.platforms = { contains: platform };
  }
  if (genre) {
    where.genres = { contains: genre };
  }
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

  // Parse JSON strings back to arrays for the frontend
  const parsed = games.map((g) => ({
    ...g,
    platforms: JSON.parse(g.platforms),
    genres: JSON.parse(g.genres),
    screenshots: JSON.parse(g.screenshots),
  }));

  return NextResponse.json({
    games: parsed,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
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
        platforms: JSON.stringify(body.platforms ?? []),
        genres: JSON.stringify(body.genres ?? []),
        status: body.status ?? "backlog",
        rating: body.rating ?? null,
        difficulty: body.difficulty ?? null,
        playTimeHours: body.playTimeHours ?? null,
        completionPct: body.completionPct ?? null,
        playYear: body.playYear ?? null,
        playDate: body.playDate ? new Date(body.playDate) : null,
        developer: body.developer ?? null,
        publisher: body.publisher ?? null,
        steamAppId: body.steamAppId ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
        screenshots: JSON.stringify(body.screenshots ?? []),
        notes: body.notes ?? null,
        isRecommended: body.isRecommended ?? false,
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
    console.error("创建游戏失败:", error);
    return NextResponse.json({ error: "创建游戏失败" }, { status: 500 });
  }
}
