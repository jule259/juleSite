import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { normalizeGameArrays } from "@/lib/utils";

// GET /api/games/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const game = await prisma.game.findUnique({ where: { id } });

  if (!game) {
    return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  }

  return NextResponse.json(normalizeGameArrays(game));
}

// PATCH /api/games/[id] — admin only
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
    if (body.platforms !== undefined) data.platforms = body.platforms;
    if (body.genres !== undefined) data.genres = body.genres;
    if (body.status !== undefined) data.status = body.status;
    if (body.rating !== undefined) data.rating = body.rating;
    if (body.difficulty !== undefined) data.difficulty = body.difficulty;
    if (body.playTimeHours !== undefined) data.playTimeHours = body.playTimeHours;
    if (body.completionPct !== undefined) data.completionPct = body.completionPct;
    if (body.playYear !== undefined) data.playYear = body.playYear;
    if (body.playDate !== undefined) data.playDate = body.playDate ? new Date(body.playDate) : null;
    if (body.developer !== undefined) data.developer = body.developer;
    if (body.publisher !== undefined) data.publisher = body.publisher;
    if (body.steamAppId !== undefined) data.steamAppId = body.steamAppId;
    if (body.coverImageUrl !== undefined) data.coverImageUrl = body.coverImageUrl;
    if (body.screenshots !== undefined) data.screenshots = body.screenshots;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.isRecommended !== undefined) data.isRecommended = body.isRecommended;

    const game = await prisma.game.update({ where: { id }, data });
    return NextResponse.json(game);
  } catch (error) {
    console.error("更新游戏失败:", error);
    return NextResponse.json({ error: "更新游戏失败" }, { status: 500 });
  }
}

// DELETE /api/games/[id] — admin only
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.game.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除游戏失败" }, { status: 500 });
  }
}
