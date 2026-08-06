import "dotenv/config";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

// 用法: tsx scripts/backup-db.ts <local|remote>（默认 local）
// 用 pg_dump 把目标库导出为 SQL 备份（含表结构 + 数据），保存到 backups/ 目录。
// 恢复方式: psql -U <user> -h <host> -d <db> -f backups/<文件名>.sql
const target = process.argv[2] ?? "local";

if (target !== "local" && target !== "remote") {
  console.error("用法: tsx scripts/backup-db.ts <local|remote>");
  process.exit(1);
}

const urlEnv = target === "local" ? "LOCAL_DATABASE_URL" : "REMOTE_DATABASE_URL";
const url = process.env[urlEnv];

function parseUrl(raw: string) {
  const u = new URL(raw);
  return {
    host: u.hostname,
    port: u.port || "5432",
    db: u.pathname.replace(/^\//, ""),
    user: u.username ? decodeURIComponent(u.username) : "postgres",
    password: u.password ? decodeURIComponent(u.password) : "",
  };
}

// pg_dump 可能不在 PATH，按常见安装路径探测
function findPgDump(): string {
  const candidates = [
    "C:/Program Files/PostgreSQL/18/bin/pg_dump.exe",
    "C:/Program Files/PostgreSQL/17/bin/pg_dump.exe",
    "C:/Program Files/PostgreSQL/16/bin/pg_dump.exe",
    "C:/Program Files/PostgreSQL/15/bin/pg_dump.exe",
    "C:/Program Files/PostgreSQL/14/bin/pg_dump.exe",
    "pg_dump", // PATH 兜底
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return "pg_dump";
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function run() {
  if (!url) {
    console.error(`错误: .env 中未配置 ${urlEnv}`);
    process.exit(1);
  }
  const conn = parseUrl(url);
  const pgDump = findPgDump();
  const backupDir = resolve(process.cwd(), "backups");
  mkdirSync(backupDir, { recursive: true });
  const outFile = join(backupDir, `julesite-${target}-${timestamp()}.sql`);

  console.log(`🔄 正在备份${target === "local" ? "本地" : "远程"}库...`);
  console.log(`   连接: ${conn.host}:${conn.port} 库=${conn.db} 用户=${conn.user}`);
  console.log(`   输出: ${outFile}`);

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(
      pgDump,
      ["-h", conn.host, "-p", conn.port, "-U", conn.user, "-d", conn.db, "-f", outFile],
      { env: { ...process.env, PGPASSWORD: conn.password }, stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) =>
      rejectPromise(new Error(`无法启动 pg_dump（${pgDump}）: ${err.message}`)),
    );
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(stderr.trim() || `pg_dump 退出码 ${code}`));
    });
  });

  const size = (statSync(outFile).size / 1024).toFixed(1);
  console.log(`✅ 备份完成: ${outFile}（${size} KB）`);
}

run().catch((e) => {
  console.error("备份失败:", e.message);
  process.exit(1);
});
