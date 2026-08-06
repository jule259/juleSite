"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  // 只允许站内相对路径，防止 /login?from=https://evil.com 开放重定向
  const rawFrom = searchParams.get("from");
  const from = rawFrom && rawFrom.startsWith("/") ? rawFrom : "/";

  // 如果已有有效 session，直接跳转
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.isAuthenticated) {
          router.replace(from);
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router, from]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // 生产环境（如 Vercel）下，router.push 的客户端导航可能漏带刚由登录接口设置的
        // httpOnly cookie，中间件读不到 session 会立刻跳回登录页。改用整页跳转，
        // 保证新 cookie 一定随请求发出（dev 与 prod 行为一致）。
        window.location.href = from;
      } else {
        const data = await res.json();
        setError(data.error ?? "登录失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">检查登录状态...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <h2 className="mb-2 text-center text-xl font-semibold text-gray-900 dark:text-white">
          请先登录
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          输入用户名和密码以访问网站
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="用户名"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="密码"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          登录后 7 天内无需重复输入密码
        </p>
      </div>
    </div>
  );
}

// 用 Suspense 包裹因为 useSearchParams
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
