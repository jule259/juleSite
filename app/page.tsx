import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          🎮 我的游戏生涯
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          记录我玩过的每一款游戏，留下通关的回忆
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/games"
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            浏览游戏库
          </Link>
          <Link
            href="/timeline"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            查看时间线
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          emoji="📚"
          title="游戏库"
          description="浏览、筛选和搜索所有记录的游戏"
          href="/games"
        />
        <FeatureCard
          emoji="📊"
          title="统计面板"
          description="游玩数据可视化：年份、平台、类型分布"
          href="/stats"
        />
        <FeatureCard
          emoji="📅"
          title="游玩时间线"
          description="按时间回顾游戏生涯的每一步"
          href="/timeline"
        />
      </section>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
  href,
}: {
  emoji: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md dark:border-gray-800"
    >
      <span className="text-3xl">{emoji}</span>
      <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </Link>
  );
}
