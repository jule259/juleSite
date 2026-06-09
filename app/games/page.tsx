"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Game {
  id: string;
  title: string;
  titleZh: string | null;
  platforms: string[];
  genres: string[];
  status: string;
  rating: number | null;
  playYear: number | null;
  coverImageUrl: string | null;
  isRecommended: boolean;
}

interface GamesResponse {
  games: Game[];
  total: number;
  page: number;
  totalPages: number;
}

const statusLabels: Record<string, string> = {
  completed: "已通关",
  playing: "在玩",
  dropped: "弃坑",
  backlog: "待玩",
  wishlist: "愿望单",
};

const statusOptions = ["all", "completed", "playing", "dropped", "backlog", "wishlist"] as const;

const platformOptions = ["all", "PC", "PS5", "Switch", "Xbox", "Mobile"];
const genreOptions = ["all", "RPG", "Action", "Action RPG", "Open World", "Souls-like", "Metroidvania", "Simulation", "Farming", "Roguelike", "CRPG", "Turn-based"];

export default function GamesPage() {
  const [data, setData] = useState<GamesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    platform: "all",
    genre: "all",
    year: "all",
    sort: "updatedAt",
    order: "desc",
    q: "",
    page: "1",
  });

  const fetchGames = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.platform !== "all") params.set("platform", filters.platform);
    if (filters.genre !== "all") params.set("genre", filters.genre);
    if (filters.year !== "all") params.set("year", filters.year);
    if (filters.q) params.set("q", filters.q);
    params.set("sort", filters.sort);
    params.set("order", filters.order);
    params.set("page", filters.page);
    params.set("pageSize", "24");

    const res = await fetch(`/api/games?${params.toString()}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  function updateFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value, page: "1" }));
  }

  const years = data?.games
    .map((g) => g.playYear)
    .filter((y): y is number => y !== null)
    .sort((a, b) => b - a);
  const uniqueYears = [...new Set(years ?? [])];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">游戏库</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder="搜索游戏..."
          value={filters.q}
          onChange={(e) => updateFilter("q", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">全部状态</option>
          {statusOptions.filter((s) => s !== "all").map((s) => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>

        {/* Platform filter */}
        <select
          value={filters.platform}
          onChange={(e) => updateFilter("platform", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">全部平台</option>
          {platformOptions.filter((p) => p !== "all").map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Genre filter */}
        <select
          value={filters.genre}
          onChange={(e) => updateFilter("genre", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">全部类型</option>
          {genreOptions.filter((g) => g !== "all").map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        {/* Year filter */}
        <select
          value={filters.year}
          onChange={(e) => updateFilter("year", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">全部年份</option>
          {uniqueYears.map((y) => (
            <option key={y} value={y.toString()}>{y}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={`${filters.sort}-${filters.order}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split("-");
            setFilters((prev) => ({ ...prev, sort, order, page: "1" }));
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="updatedAt-desc">最近更新</option>
          <option value="rating-desc">评分最高</option>
          <option value="playYear-desc">游玩年份（新→旧）</option>
          <option value="playYear-asc">游玩年份（旧→新）</option>
          <option value="title-asc">名称 A-Z</option>
        </select>

        {/* Clear all */}
        <button
          onClick={() =>
            setFilters({
              status: "all",
              platform: "all",
              genre: "all",
              year: "all",
              sort: "updatedAt",
              order: "desc",
              q: "",
              page: "1",
            })
          }
          className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          清除筛选
        </button>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {data ? `共 ${data.total} 款游戏` : "加载中..."}
      </p>

      {/* Game grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-3 h-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-lg dark:border-gray-800"
              >
                {game.coverImageUrl ? (
                  <img
                    src={game.coverImageUrl}
                    alt={game.title}
                    className="mb-3 h-32 w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <span className="text-3xl">🎮</span>
                  </div>
                )}
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  {game.title}
                  {game.titleZh && <span className="ml-1 text-sm font-normal text-gray-400">({game.titleZh})</span>}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {statusLabels[game.status] ?? game.status}
                  </span>
                  {game.rating && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      ⭐ {game.rating}/10
                    </span>
                  )}
                  {game.isRecommended && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      👍 推荐
                    </span>
                  )}
                  {game.platforms.map((p) => (
                    <span key={p} className="text-gray-400">{p}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>

          {/* Empty state */}
          {data?.games.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-4xl">🔍</p>
              <p className="mt-4 text-gray-500 dark:text-gray-400">没有找到匹配的游戏，试试调整筛选条件</p>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => updateFilter("page", (parseInt(filters.page) - 1).toString())}
            disabled={parseInt(filters.page) <= 1}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-30 dark:border-gray-700"
          >
            上一页
          </button>
          <span className="px-2 text-sm text-gray-500">
            {data.page} / {data.totalPages}
          </span>
          <button
            onClick={() => updateFilter("page", (parseInt(filters.page) + 1).toString())}
            disabled={parseInt(filters.page) >= data.totalPages}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-30 dark:border-gray-700"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
