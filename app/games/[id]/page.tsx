import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface Props {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<string, string> = {
  completed: "✅ 已通关",
  playing: "🎮 在玩",
  dropped: "❌ 弃坑",
  backlog: "📋 待玩",
  wishlist: "⭐ 愿望单",
};

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params;
  const game = await prisma.game.findUnique({ where: { id } });

  if (!game) {
    notFound();
  }

  const platforms: string[] = game.platforms as string[];
  const genres: string[] = game.genres as string[];
  const screenshots: string[] = game.screenshots as string[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/games"
        className="mb-6 inline-flex text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        ← 返回游戏库
      </Link>

      {/* Header */}
      <div className="mb-8">
        {game.coverImageUrl && (
          <img
            src={game.coverImageUrl}
            alt={game.title}
            className="mb-6 w-full rounded-xl object-cover shadow-md"
            style={{ maxHeight: "300px" }}
          />
        )}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {game.title}
          {game.titleZh && <span className="ml-2 text-xl text-gray-400">({game.titleZh})</span>}
        </h1>

        {/* Meta badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
            {statusLabels[game.status] ?? game.status}
          </span>
          {game.rating && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              ⭐ {game.rating} / 10
            </span>
          )}
          {game.isRecommended && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
              👍 推荐
            </span>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 rounded-xl border border-gray-200 p-6 dark:border-gray-800 sm:grid-cols-3">
        {game.developer && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">开发商</span>
            <p className="font-medium text-gray-900 dark:text-white">{game.developer}</p>
          </div>
        )}
        {game.publisher && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">发行商</span>
            <p className="font-medium text-gray-900 dark:text-white">{game.publisher}</p>
          </div>
        )}
        {game.playYear && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">游玩年份</span>
            <p className="font-medium text-gray-900 dark:text-white">{game.playYear}</p>
          </div>
        )}
        {game.playTimeHours && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">游玩时长</span>
            <p className="font-medium text-gray-900 dark:text-white">{game.playTimeHours} 小时</p>
          </div>
        )}
        {game.steamAppId && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Steam</span>
            <a
              href={`https://store.steampowered.com/app/${game.steamAppId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              商店页面 →
            </a>
          </div>
        )}
      </div>

      {/* Platforms & Genres */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">平台</span>
          <div className="mt-1 flex gap-1">
            {platforms.map((p) => (
              <span key={p} className="rounded-md bg-gray-100 px-2 py-0.5 text-sm dark:bg-gray-800">{p}</span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">类型</span>
          <div className="mt-1 flex gap-1">
            {genres.map((g) => (
              <span key={g} className="rounded-md bg-gray-100 px-2 py-0.5 text-sm dark:bg-gray-800">{g}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      {game.notes && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">📝 我的感想</h2>
          <div className="prose prose-gray max-w-none dark:prose-invert rounded-xl border border-gray-200 p-6 dark:border-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {game.notes}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Screenshots */}
      {screenshots.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">📸 截图</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {screenshots.map((url, i) => (
              <img key={i} src={url} alt={`Screenshot ${i + 1}`} className="rounded-lg" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
