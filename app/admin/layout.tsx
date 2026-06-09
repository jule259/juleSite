import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">管理后台</h1>
        <nav className="flex gap-3 text-sm">
          <Link
            href="/admin/games"
            className="rounded-md bg-gray-100 px-3 py-1.5 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            游戏管理
          </Link>
          <Link
            href="/admin/import"
            className="rounded-md bg-gray-100 px-3 py-1.5 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Steam 导入
          </Link>
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            ← 返回前台
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
