'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/games', label: '游戏库' },
  { href: '/games/upcoming', label: '即将发售' },
  { href: '/stats', label: '统计' },
  { href: '/timeline', label: '时间线' },
  { href: '/admin', label: '管理' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  // 未登录时只能访问 /login（由 middleware 保证），此时隐藏导航栏
  if (pathname === "/login") return null;

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  // 桌面端与移动端菜单共用的退出逻辑
  function logout() {
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "site" }),
    }).then(() => router.push("/login"));
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          🎮 JuleSite
        </Link>

        {/* 桌面端导航（md 及以上） */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={toggleDark}
            className="ml-2 rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="切换暗色模式"
          >
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={logout}
            className="ml-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            title="退出登录"
          >
            退出
          </button>
        </div>

        {/* 移动端（md 以下）：暗色切换 + 汉堡按钮 */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={toggleDark}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="切换暗色模式"
          >
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* 移动端下拉菜单（md 以下展开） */}
      {menuOpen && (
        <div className="md:hidden">
          {/* 点击菜单外区域关闭 */}
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="relative z-50 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
            <nav className="mx-auto max-w-6xl px-4 py-3">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  退出登录
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
