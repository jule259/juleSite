"use client";

import { useState, useEffect } from "react";
import CoverImage from "@/components/CoverImage";

interface UpcomingGame {
  id: string;
  title: string;
  titleZh: string | null;
  releaseDate: string | null;
  platforms: string[];
  genres: string[];
  price: string | null;
  summary: string | null;
  coverImageUrl: string | null;
  developer: string | null;
  publisher: string | null;
  steamAppId: string | null;
  isInterested: boolean;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function UpcomingGamesPage() {
  const [games, setGames] = useState<UpcomingGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/upcoming")
      .then((res) => res.json())
      .then((data) => {
        setGames(data.games);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">即将发售</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-3 aspect-[3/4] w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">即将发售</h1>
      <p className="mb-8 text-gray-500 dark:text-gray-400">
        我期待的游戏 · {games.length} 款
      </p>

      {games.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-4xl">📅</p>
          <p className="mt-4 text-gray-500 dark:text-gray-400">暂无即将发售的游戏</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => {
            const days = game.releaseDate ? daysUntil(game.releaseDate) : null;
            return (
              <div
                key={game.id}
                className="rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md dark:border-gray-800"
              >
                <CoverImage
                  src={game.coverImageUrl}
                  alt={game.title}
                  className="mb-3 aspect-[3/4] w-full rounded-lg object-cover"
                  emojiClassName="text-4xl"
                />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {game.title}
                  {game.titleZh && <span className="ml-1 text-sm font-normal text-gray-400">({game.titleZh})</span>}
                </h3>

                {/* Release countdown */}
                {days !== null && (
                  <p
                    className={`mt-1 text-sm font-medium ${
                      days <= 0
                        ? "text-green-600 dark:text-green-400"
                        : days <= 30
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {days <= 0
                      ? "🎉 已发售！"
                      : days <= 7
                        ? `⏰ 还有 ${days} 天`
                        : `📅 ${new Date(game.releaseDate!).toLocaleDateString("zh-CN")}（${days} 天）`}
                  </p>
                )}

                {/* Price */}
                {game.price && (
                  <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">{game.price}</p>
                )}

                {/* Summary */}
                {game.summary && (
                  <p className="mt-2 line-clamp-3 text-xs text-gray-500 dark:text-gray-400">{game.summary}</p>
                )}

                {/* Meta */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {game.platforms.map((p) => (
                    <span key={p} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {p}
                    </span>
                  ))}
                  {game.genres.map((g) => (
                    <span key={g} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Steam link */}
                {game.steamAppId && (
                  <a
                    href={`https://store.steampowered.com/app/${game.steamAppId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Steam 商店 →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
