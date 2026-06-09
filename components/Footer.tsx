export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50 py-8 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500 dark:text-gray-500">
        <p>🎮 JuleSite — 记录我的游戏生涯</p>
        <p className="mt-1">
          Built with{' '}
          <a href="https://nextjs.org" className="underline hover:text-gray-700 dark:hover:text-gray-300">
            Next.js
          </a>
          {' '}+ TypeScript + Prisma
        </p>
      </div>
    </footer>
  );
}
