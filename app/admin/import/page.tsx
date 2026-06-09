"use client";

import { useState } from "react";

interface SteamGame {
  title: string;
  steamAppId: string;
  coverImageUrl: string;
  playTimeHours: number;
  developer: string | null;
  publisher: string | null;
  genres: string[];
}

export default function SteamImportPage() {
  const [steamId, setSteamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [games, setGames] = useState<SteamGame[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleFetchLibrary() {
    if (!steamId.trim()) {
      setError("请输入 Steam ID");
      return;
    }
    setError("");
    setFetching(true);
    setGames([]);
    setSelected(new Set());

    try {
      const res = await fetch(`/api/steam/library?steamId=${encodeURIComponent(steamId.trim())}`);
      const data = await res.json();

      if (res.ok) {
        setGames(data.games);
        setMessage(`找到 ${data.total} 款游戏`);
      } else {
        setError(data.error ?? "获取失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setFetching(false);
    }
  }

  function toggleSelect(index: number) {
    const next = new Set(selected);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === games.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(games.map((_, i) => i)));
    }
  }

  async function handleImport() {
    if (selected.size === 0) {
      setError("请至少选择一款游戏");
      return;
    }

    setLoading(true);
    setError("");

    const toImport = Array.from(selected).map((i) => games[i]);

    try {
      const res = await fetch("/api/steam/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games: toImport }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setSelected(new Set());
      } else {
        setError(data.error ?? "导入失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Steam 游戏库导入</h2>

      {/* How to find Steam ID */}
      <details className="mb-6 rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-800">
        <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
          如何找到我的 Steam ID？
        </summary>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-gray-500 dark:text-gray-400">
          <li>打开 Steam 客户端，点击右上角头像 → 「账户明细」</li>
          <li>在页面顶部可以看到你的 Steam ID（格式为 7656119xxxxxxxxxx）</li>
          <li>确保你的 Steam 个人资料设置为「公开」</li>
          <li>确保已在 <code>.env</code> 中设置了 <code>STEAM_API_KEY</code></li>
        </ol>
      </details>

      {/* Input */}
      <div className="mb-4 flex gap-3">
        <input
          type="text"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          placeholder="输入 Steam ID（如 7656119xxxxxxxxxx）"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          onClick={handleFetchLibrary}
          disabled={fetching}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {fetching ? "获取中..." : "获取游戏库"}
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Game list */}
      {games.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              已选择 {selected.size} / {games.length} 款
            </p>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="rounded-lg border px-3 py-1 text-sm dark:border-gray-700"
              >
                {selected.size === games.length ? "取消全选" : "全选"}
              </button>
              <button
                onClick={handleImport}
                disabled={loading || selected.size === 0}
                className="rounded-lg bg-gray-900 px-4 py-1 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {loading ? "导入中..." : `导入选中 (${selected.size})`}
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-400">选择</th>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-400">封面</th>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-400">名称</th>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-400">时长</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game, i) => (
                  <tr
                    key={game.steamAppId}
                    className={`cursor-pointer border-t border-gray-100 dark:border-gray-800/50 ${
                      selected.has(i) ? "bg-blue-50 dark:bg-blue-900/10" : ""
                    }`}
                    onClick={() => toggleSelect(i)}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleSelect(i)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <img
                        src={game.coverImageUrl}
                        alt={game.title}
                        className="h-10 w-20 rounded object-cover"
                        loading="lazy"
                      />
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">{game.title}</td>
                    <td className="px-4 py-2 text-gray-500">{game.playTimeHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {fetching && (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-4 text-sm text-gray-500">正在从 Steam 获取游戏库...</p>
        </div>
      )}
    </div>
  );
}
