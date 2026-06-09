"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Game {
  id: string;
  title: string;
  titleZh: string | null;
  platforms: string[];
  genres: string[];
  status: string;
  rating: number | null;
  difficulty: number | null;
  playTimeHours: number | null;
  completionPct: number | null;
  playYear: number | null;
  playDate: string | null;
  developer: string | null;
  publisher: string | null;
  steamAppId: string | null;
  coverImageUrl: string | null;
  notes: string | null;
  isRecommended: boolean;
  screenshots: string[];
}

interface FormData {
  title: string;
  titleZh: string;
  platforms: string;
  genres: string;
  status: string;
  rating: string;
  playYear: string;
  developer: string;
  publisher: string;
  steamAppId: string;
  coverImageUrl: string;
  notes: string;
}

const emptyForm: FormData = {
  title: "",
  titleZh: "",
  platforms: "",
  genres: "",
  status: "backlog",
  rating: "",
  playYear: "",
  developer: "",
  publisher: "",
  steamAppId: "",
  coverImageUrl: "",
  notes: "",
};

export default function AdminGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [editing, setEditing] = useState<Game | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchGames = useCallback(async () => {
    const res = await fetch("/api/games?pageSize=100");
    if (res.status === 403) {
      setAuthorized(false);
      return;
    }
    const data = await res.json();
    setGames(data.games);
  }, []);

  useEffect(() => {
    fetchGames().finally(() => setLoading(false));
  }, [fetchGames]);

  function fillForm(game: Game) {
    setForm({
      title: game.title,
      titleZh: game.titleZh ?? "",
      platforms: game.platforms.join(", "),
      genres: game.genres.join(", "),
      status: game.status,
      rating: game.rating?.toString() ?? "",
      playYear: game.playYear?.toString() ?? "",
      developer: game.developer ?? "",
      publisher: game.publisher ?? "",
      steamAppId: game.steamAppId ?? "",
      coverImageUrl: game.coverImageUrl ?? "",
      notes: game.notes ?? "",
    });
  }

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
  }

  function parseForm(): Record<string, unknown> {
    return {
      title: form.title,
      titleZh: form.titleZh || null,
      platforms: form.platforms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      genres: form.genres
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      status: form.status,
      rating: form.rating ? parseInt(form.rating) : null,
      playYear: form.playYear ? parseInt(form.playYear) : null,
      developer: form.developer || null,
      publisher: form.publisher || null,
      steamAppId: form.steamAppId || null,
      coverImageUrl: form.coverImageUrl || null,
      notes: form.notes || null,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setMessage("");

    const data = parseForm();

    try {
      const url = editing ? `/api/games/${editing.id}` : "/api/games";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMessage(editing ? "游戏已更新！" : "游戏已添加！");
        resetForm();
        await fetchGames();
      } else {
        const err = await res.json();
        setMessage(err.error ?? "操作失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`确定要删除「${title}」吗？此操作不可撤销。`)) return;

    const res = await fetch(`/api/games/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("游戏已删除");
      await fetchGames();
    } else {
      setMessage("删除失败");
    }
  }

  function startEdit(game: Game) {
    setEditing(game);
    fillForm(game);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Check auth
  if (!authorized) {
    router.push("/admin");
    return null;
  }

  const statusLabels: Record<string, string> = {
    completed: "✅ 已通关",
    playing: "🎮 在玩",
    dropped: "❌ 弃坑",
    backlog: "📋 待玩",
    wishlist: "⭐ 愿望单",
  };

  return (
    <div>
      {message && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {message}
        </div>
      )}

      {/* Form */}
      <div className="mb-8 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {editing ? `编辑游戏：${editing.title}` : "添加新游戏"}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">游戏名称 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">中文名</label>
            <input
              value={form.titleZh}
              onChange={(e) => setForm({ ...form, titleZh: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">状态</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">平台（逗号分隔）</label>
            <input
              value={form.platforms}
              onChange={(e) => setForm({ ...form, platforms: e.target.value })}
              placeholder="PC, PS5, Switch"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">类型（逗号分隔）</label>
            <input
              value={form.genres}
              onChange={(e) => setForm({ ...form, genres: e.target.value })}
              placeholder="RPG, Action"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">评分 (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">游玩年份</label>
            <input
              type="number"
              value={form.playYear}
              onChange={(e) => setForm({ ...form, playYear: e.target.value })}
              placeholder="2024"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">开发商</label>
            <input
              value={form.developer}
              onChange={(e) => setForm({ ...form, developer: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">发行商</label>
            <input
              value={form.publisher}
              onChange={(e) => setForm({ ...form, publisher: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Steam App ID</label>
            <input
              value={form.steamAppId}
              onChange={(e) => setForm({ ...form, steamAppId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">封面图 URL</label>
            <input
              value={form.coverImageUrl}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {saving ? "保存中..." : editing ? "更新游戏" : "添加游戏"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-6 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                取消编辑
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Game list */}
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        游戏列表 ({games.length})
      </h2>
      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">名称</th>
                <th className="py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">状态</th>
                <th className="py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">评分</th>
                <th className="py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">年份</th>
                <th className="py-2 font-medium text-gray-600 dark:text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id} className="border-b border-gray-100 dark:border-gray-800/50">
                  <td className="py-2 pr-4 text-gray-900 dark:text-white">
                    {game.title}
                    {game.titleZh && <span className="ml-1 text-xs text-gray-400">({game.titleZh})</span>}
                  </td>
                  <td className="py-2 pr-4 text-xs">{statusLabels[game.status] ?? game.status}</td>
                  <td className="py-2 pr-4">{game.rating ? `${game.rating}/10` : "-"}</td>
                  <td className="py-2 pr-4 text-gray-500">{game.playYear ?? "-"}</td>
                  <td className="py-2">
                    <button
                      onClick={() => startEdit(game)}
                      className="mr-2 text-blue-600 hover:underline dark:text-blue-400"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(game.id, game.title)}
                      className="text-red-600 hover:underline dark:text-red-400"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {games.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    还没有游戏，用上面的表单添加第一个吧！🎮
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
