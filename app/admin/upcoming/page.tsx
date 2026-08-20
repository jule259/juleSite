"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  steamAppId: string | null;
  isInterested: boolean;
}

interface IGDBResult {
  igdbId: number;
  title: string;
  summary: string | null;
  releaseDate: string | null;
  coverImageUrl: string | null;
  screenshots: string[];
  genres: string[];
  platforms: string[];
  developer: string | null;
  publisher: string | null;
}

interface FormData {
  title: string;
  titleZh: string;
  releaseDate: string;
  platforms: string;
  genres: string;
  price: string;
  summary: string;
  coverImageUrl: string;
  steamAppId: string;
  developer: string;
  isInterested: boolean;
}

const emptyForm: FormData = {
  title: "",
  titleZh: "",
  releaseDate: "",
  platforms: "",
  genres: "",
  price: "",
  summary: "",
  coverImageUrl: "",
  steamAppId: "",
  developer: "",
  isInterested: true,
};

export default function AdminUpcomingPage() {
  const router = useRouter();
  const [games, setGames] = useState<UpcomingGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // IGDB search
  const [igdbQuery, setIgdbQuery] = useState("");
  const [igdbResults, setIgdbResults] = useState<IGDBResult[]>([]);
  const [igdbSearching, setIgdbSearching] = useState(false);

  const fetchGames = useCallback(async () => {
    const res = await fetch("/api/upcoming");
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

  async function handleIGDBSearch() {
    if (!igdbQuery.trim()) return;
    setIgdbSearching(true);
    try {
      const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(igdbQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setIgdbResults(data.results);
      }
    } catch {
      // IGDB not configured
    } finally {
      setIgdbSearching(false);
    }
  }

  function fillFromIGDB(result: IGDBResult) {
    setForm({
      title: result.title,
      titleZh: "",
      releaseDate: result.releaseDate?.split("T")[0] ?? "",
      platforms: result.platforms.join(", "),
      genres: result.genres.join(", "),
      price: "",
      summary: result.summary ?? "",
      coverImageUrl: result.coverImageUrl ?? "",
      steamAppId: "",
      developer: result.developer ?? "",
      isInterested: true,
    });
    setIgdbResults([]);
    setIgdbQuery("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setMessage("");

    const data = {
      title: form.title,
      titleZh: form.titleZh || null,
      releaseDate: form.releaseDate || null,
      platforms: form.platforms.split(",").map((s) => s.trim()).filter(Boolean),
      genres: form.genres.split(",").map((s) => s.trim()).filter(Boolean),
      price: form.price || null,
      summary: form.summary || null,
      coverImageUrl: form.coverImageUrl || null,
      steamAppId: form.steamAppId || null,
      developer: form.developer || null,
      isInterested: form.isInterested,
    };

    try {
      const res = await fetch("/api/upcoming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMessage("游戏已添加！");
        setForm(emptyForm);
        await fetchGames();
      } else {
        const err = await res.json();
        setMessage(err.error ?? "添加失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`确定要删除「${title}」吗？`)) return;
    await fetch(`/api/upcoming/${id}`, { method: "DELETE" });
    await fetchGames();
  }

  if (!authorized) {
    router.push("/admin");
    return null;
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">即将发售游戏管理</h2>

      {message && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {message}
        </div>
      )}

      {/* IGDB Search */}
      <div className="mb-6 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          🔍 IGDB 搜索（自动补全元数据）
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={igdbQuery}
            onChange={(e) => setIgdbQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleIGDBSearch()}
            placeholder="搜索游戏名称..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={handleIGDBSearch}
            disabled={igdbSearching}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {igdbSearching ? "搜索中..." : "搜索"}
          </button>
        </div>
        {igdbResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {igdbResults.map((r) => (
              <div
                key={r.igdbId}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-100 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => fillFromIGDB(r)}
              >
                {r.coverImageUrl && (
                  <img src={r.coverImageUrl} alt={r.title} className="aspect-[3/4] h-12 rounded object-cover" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</p>
                  {r.releaseDate && (
                    <p className="text-xs text-gray-500">{new Date(r.releaseDate).toLocaleDateString("zh-CN")}</p>
                  )}
                </div>
                <span className="ml-auto text-xs text-purple-600">点击填充 →</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      <div className="mb-8 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">手动添加</h3>
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
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">发售日期</label>
            <input
              type="date"
              value={form.releaseDate}
              onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">平台（逗号分隔）</label>
            <input
              value={form.platforms}
              onChange={(e) => setForm({ ...form, platforms: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">售价</label>
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="¥298 / $59.99"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {saving ? "添加中..." : "添加游戏"}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">已添加 ({games.length})</h3>
      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">名称</th>
                <th className="py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">发售日</th>
                <th className="py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">售价</th>
                <th className="py-2 font-medium text-gray-600 dark:text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id} className="border-b border-gray-100 dark:border-gray-800/50">
                  <td className="py-2 pr-4 text-gray-900 dark:text-white">
                    {g.title}
                    {g.titleZh && <span className="ml-1 text-xs text-gray-400">({g.titleZh})</span>}
                  </td>
                  <td className="py-2 pr-4 text-gray-500">
                    {g.releaseDate ? new Date(g.releaseDate).toLocaleDateString("zh-CN") : "-"}
                  </td>
                  <td className="py-2 pr-4 text-gray-500">{g.price ?? "-"}</td>
                  <td className="py-2">
                    <button
                      onClick={() => handleDelete(g.id, g.title)}
                      className="text-red-600 hover:underline dark:text-red-400"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
