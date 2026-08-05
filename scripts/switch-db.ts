import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// 用法: tsx scripts/switch-db.ts <local|remote>
// 把 .env 里的 DATABASE_URL 改写为 LOCAL_DATABASE_URL 或 REMOTE_DATABASE_URL 的值。
const TARGETS: Record<string, string> = {
  local: "LOCAL_DATABASE_URL",
  remote: "REMOTE_DATABASE_URL",
};

const target = process.argv[2];
const varName = TARGETS[target];

if (!varName) {
  console.error("用法: tsx scripts/switch-db.ts <local|remote>");
  process.exit(1);
}

const newUrl = process.env[varName];
if (!newUrl) {
  console.error(`错误: .env 中未配置 ${varName}`);
  process.exit(1);
}

function maskPassword(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    // URL 解析失败时退化为正则掩码
    return url.replace(/:([^@/:]+)@/, ":***@");
  }
}

const ENV_PATH = resolve(process.cwd(), ".env");
const raw = readFileSync(ENV_PATH, "utf8");
const eol = raw.includes("\r\n") ? "\r\n" : "\n";

// 只替换 DATABASE_URL 行的值，保留行首空白、= 间距与原引号风格；找不到则追加一行。
let found = false;
let unchanged = false;

const lines = raw.split(/\r?\n/).map((line) => {
  const m = line.match(/^(\s*DATABASE_URL\s*=\s*)(['"]?)(.*?)\2\s*$/);
  if (!m) return line;
  found = true;
  const [, prefix, quote] = m;
  if (m[3] === newUrl) {
    unchanged = true;
    return line;
  }
  return `${prefix}${quote || '"'}${newUrl}${quote || '"'}`;
});

if (!found) {
  lines.push(`DATABASE_URL="${newUrl}"`);
}

if (found && unchanged) {
  console.log(`✅ DATABASE_URL 已指向 ${varName}，无需切换`);
  process.exit(0);
}

writeFileSync(ENV_PATH, lines.join(eol));

console.log(`\n🔀 已将 DATABASE_URL 切换到 ${varName}:`);
console.log(`   ${maskPassword(newUrl)}`);
console.log("\n提示:");
if (!found) {
  console.log("  - .env 中原本没有 DATABASE_URL，已追加一行");
}
console.log("  - 若该数据库尚未建表，先运行: npx prisma db push");
console.log("  - 若 dev server 正在运行，需重启才能生效（.env 在进程启动时加载）");
