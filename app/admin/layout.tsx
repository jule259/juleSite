"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.isAdmin === true))
      .catch(() => setIsAdmin(false));
  }, [pathname]);

  async function handleLeave() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "admin" }),
    });
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">管理后台</h1>
        <nav className="flex gap-3 text-sm">
          {isAdmin && (
            <>
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
            </>
          )}
          {isAdmin && (
            <button
              onClick={handleLeave}
              className="cursor-pointer rounded-md px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              ← 返回前台
            </button>
          )}
        </nav>
      </div>
      {children}
    </div>
  );
}
