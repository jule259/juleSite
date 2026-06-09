"use client";

import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Game {
  status: string;
  rating: number | null;
  playYear: number | null;
  platforms: string[];
  genres: string[];
  isRecommended: boolean;
  playTimeHours: number | null;
}

/** Ensure value is an array (defense against PostgreSQL array literals) */
function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v;
  return [];
}

export default function StatsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/games?pageSize=500")
      .then((res) => res.json())
      .then((data) => {
        setGames(data.games);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">统计面板</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <div className="mb-4 h-5 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-48 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Computed stats ---

  // Status distribution
  const statusCount: Record<string, number> = {};
  games.forEach((g) => {
    statusCount[g.status] = (statusCount[g.status] ?? 0) + 1;
  });

  const statusLabels: Record<string, string> = {
    completed: "已通关",
    playing: "在玩",
    dropped: "弃坑",
    backlog: "待玩",
    wishlist: "愿望单",
  };

  // Year distribution
  const yearCount: Record<string, number> = {};
  games
    .filter((g) => g.playYear)
    .forEach((g) => {
      const y = g.playYear!.toString();
      yearCount[y] = (yearCount[y] ?? 0) + 1;
    });
  const sortedYears = Object.keys(yearCount).sort();

  // Platform distribution
  const platformCount: Record<string, number> = {};
  games.forEach((g) => {
    asArray(g.platforms).forEach((p) => {
      platformCount[p] = (platformCount[p] ?? 0) + 1;
    });
  });

  // Genre distribution
  const genreCount: Record<string, number> = {};
  games.forEach((g) => {
    asArray(g.genres).forEach((genre) => {
      genreCount[genre] = (genreCount[genre] ?? 0) + 1;
    });
  });

  // Rating distribution
  const ratingBuckets = { "1-3": 0, "4-6": 0, "7-8": 0, "9-10": 0 };
  games
    .filter((g) => g.rating)
    .forEach((g) => {
      const r = g.rating!;
      if (r <= 3) ratingBuckets["1-3"]++;
      else if (r <= 6) ratingBuckets["4-6"]++;
      else if (r <= 8) ratingBuckets["7-8"]++;
      else ratingBuckets["9-10"]++;
    });

  // Totals
  const totalGames = games.length;
  const totalCompleted = games.filter((g) => g.status === "completed").length;
  const totalHours = games.reduce((sum, g) => sum + (g.playTimeHours ?? 0), 0);
  const avgRating =
    games.filter((g) => g.rating).length > 0
      ? (games.filter((g) => g.rating).reduce((sum, g) => sum + g.rating!, 0) / games.filter((g) => g.rating).length).toFixed(1)
      : "-";
  const recommended = games.filter((g) => g.isRecommended).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">📊 统计面板</h1>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="总游戏数" value={totalGames.toString()} />
        <SummaryCard label="已通关" value={totalCompleted.toString()} />
        <SummaryCard label="总时长" value={`${totalHours.toFixed(0)}h`} />
        <SummaryCard label="平均评分" value={`${avgRating}/10`} />
        <SummaryCard label="推荐数" value={recommended.toString()} />
        <SummaryCard
          label="通关率"
          value={totalGames > 0 ? `${((totalCompleted / totalGames) * 100).toFixed(0)}%` : "-"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Year chart */}
        {sortedYears.length > 0 && (
          <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">游玩年份分布</h3>
            <Bar
              data={{
                labels: sortedYears,
                datasets: [
                  {
                    label: "游戏数量",
                    data: sortedYears.map((y) => yearCount[y]),
                    backgroundColor: "#6366f1",
                    borderRadius: 4,
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>
        )}

        {/* Status chart */}
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">游戏状态分布</h3>
          <Doughnut
            data={{
              labels: Object.keys(statusCount).map((k) => statusLabels[k] ?? k),
              datasets: [
                {
                  data: Object.values(statusCount),
                  backgroundColor: ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#a855f7"],
                },
              ],
            }}
            options={{ responsive: true }}
          />
        </div>

        {/* Platform chart */}
        {Object.keys(platformCount).length > 0 && (
          <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">平台分布</h3>
            <Bar
              data={{
                labels: Object.keys(platformCount),
                datasets: [
                  {
                    label: "游戏数量",
                    data: Object.values(platformCount),
                    backgroundColor: "#06b6d4",
                    borderRadius: 4,
                  },
                ],
              }}
              options={{ responsive: true, indexAxis: "y", plugins: { legend: { display: false } } }}
            />
          </div>
        )}

        {/* Rating chart */}
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">评分分布</h3>
          <Bar
            data={{
              labels: Object.keys(ratingBuckets),
              datasets: [
                {
                  label: "游戏数量",
                  data: Object.values(ratingBuckets),
                  backgroundColor: ["#f87171", "#fbbf24", "#a3e635", "#22c55e"],
                  borderRadius: 4,
                },
              ],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>

        {/* Genre chart */}
        {Object.keys(genreCount).length > 0 && (
          <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">游戏类型分布</h3>
            <Bar
              data={{
                labels: Object.keys(genreCount),
                datasets: [
                  {
                    label: "游戏数量",
                    data: Object.values(genreCount),
                    backgroundColor: "#ec4899",
                    borderRadius: 4,
                  },
                ],
              }}
              options={{ responsive: true, indexAxis: "y", plugins: { legend: { display: false } } }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 text-center dark:border-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
