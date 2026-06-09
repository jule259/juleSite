import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

// PATCH /api/upcoming/[id] — admin only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.titleZh !== undefined) data.titleZh = body.titleZh;
    if (body.releaseDate !== undefined) data.releaseDate = body.releaseDate ? new Date(body.releaseDate) : null;
    if (body.platforms !== undefined) data.platforms = JSON.stringify(body.platforms);
    if (body.genres !== undefined) data.genres = JSON.stringify(body.genres);
    if (body.price !== undefined) data.price = body.price;
    if (body.summary !== undefined) data.summary = body.summary;
    if (body.coverImageUrl !== undefined) data.coverImageUrl = body.coverImageUrl;
    if (body.screenshots !== undefined) data.screenshots = JSON.stringify(body.screenshots);
    if (body.steamAppId !== undefined) data.steamAppId = body.steamAppId;
    if (body.developer !== undefined) data.developer = body.developer;
    if (body.publisher !== undefined) data.publisher = body.publisher;
    if (body.isInterested !== undefined) data.isInterested = body.isInterested;

    const game = await prisma.upcomingGame.update({ where: { id }, data });

    return NextResponse.json({
      ...game,
      platforms: JSON.parse(game.platforms),
      genres: JSON.parse(game.genres),
      screenshots: JSON.parse(game.screenshots),
    });
  } catch (error) {
    console.error("更新即将发售游戏失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE /api/upcoming/[id] — admin only
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.upcomingGame.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
