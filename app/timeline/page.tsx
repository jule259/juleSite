import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  completed: "✅ 已通关",
  playing: "🎮 在玩",
  dropped: "❌ 弃坑",
  backlog: "📋 待玩",
  wishlist: "⭐ 愿望单",
};

export default async function TimelinePage() {
  const games = await prisma.game.findMany({
    orderBy: [{ playYear: "desc" }, { playDate: "desc" }, { updatedAt: "desc" }],
  });

  // Group by year
  const parsed = games.map((g) => ({
    ...g,
    platforms: g.platforms as string[],
    genres: g.genres as string[],
  }));

  const grouped: Record<number, typeof parsed> = {};
  parsed.forEach((g) => {
    const year = g.playYear ?? 0;
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(g);
  });

  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">📅 游玩时间线</h1>

      {years.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">🕐</p>
          <p className="mt-4 text-gray-500 dark:text-gray-400">还没有游戏记录，去添加一些吧！</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 h-full w-px bg-gray-200 dark:bg-gray-800" />

          {years.map((year) => (
            <div key={year} className="mb-10">
              {/* Year marker */}
              <div className="mb-4 flex items-center gap-3">
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                  {year || "?"}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {year || "未分类"}
                </h2>
              </div>

              {/* Games in this year */}
              <div className="ml-11 space-y-3">
                {grouped[year].map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="block rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md dark:border-gray-800"
                  >
                    <div className="flex items-start gap-4">
                      {game.coverImageUrl ? (
                        <img
                          src={game.coverImageUrl}
                          alt={game.title}
                          className="h-16 w-28 shrink-0 rounded object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                          <span className="text-xl">🎮</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {game.title}
                          {game.titleZh && (
                            <span className="ml-1 text-sm font-normal text-gray-400">({game.titleZh})</span>
                          )}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-gray-500">
                            {statusLabels[game.status] ?? game.status}
                          </span>
                          {game.rating && (
                            <span className="text-yellow-600 dark:text-yellow-400">⭐ {game.rating}</span>
                          )}
                          {game.platforms.map((p) => (
                            <span key={p} className="text-gray-400">{p}</span>
                          ))}
                        </div>
                        {game.playDate && (
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(game.playDate).toLocaleDateString("zh-CN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
