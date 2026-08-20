import "dotenv/config";
import { createPrismaClient } from "../lib/prisma";

// 用法:
//   tsx scripts/migrate-covers.ts            → 跟随当前 DATABASE_URL
//   tsx scripts/migrate-covers.ts local      → LOCAL_DATABASE_URL
//   tsx scripts/migrate-covers.ts remote     → REMOTE_DATABASE_URL
// 把历史 Steam 封面从横版横幅 header.jpg 统一迁移为竖版 library_600x900.jpg。
// 幂等：已迁移的行 REPLACE 找不到 /header.jpg，更新 0 行，可重复运行。
const TARGETS: Record<string, string> = {
  local: "LOCAL_DATABASE_URL",
  remote: "REMOTE_DATABASE_URL",
};

const arg = process.argv[2];
let url: string | undefined;
let label = "DATABASE_URL（当前）";

if (arg) {
  const varName = TARGETS[arg];
  if (!varName) {
    console.error("用法: tsx scripts/migrate-covers.ts [local|remote]");
    process.exit(1);
  }
  url = process.env[varName];
  if (!url) {
    console.error(`错误: .env 中未配置 ${varName}`);
    process.exit(1);
  }
  label = varName;
}

async function main() {
  const db = createPrismaClient(url);
  console.log(`🔄 迁移 Steam 封面 header.jpg → library_600x900.jpg（目标: ${label}）...`);

  // Neon HTTP 不支持事务/批量操作，但单条 UPDATE 语句可用（见 sync-db.ts 既有用法）。
  // 用 '/header.jpg' 后缀匹配只命中 Steam CDN 行（IGDB URL 永不以 header.jpg 结尾，天然安全）。
  const gameCount = await db.$executeRawUnsafe(
    `UPDATE "Game" SET "coverImageUrl" = REPLACE("coverImageUrl", '/header.jpg', '/library_600x900.jpg') WHERE "coverImageUrl" LIKE '%/header.jpg'`,
  );
  const upcomingCount = await db.$executeRawUnsafe(
    `UPDATE "UpcomingGame" SET "coverImageUrl" = REPLACE("coverImageUrl", '/header.jpg', '/library_600x900.jpg') WHERE "coverImageUrl" LIKE '%/header.jpg'`,
  );

  console.log(`✅ Game: 更新 ${gameCount} 条`);
  console.log(`✅ UpcomingGame: 更新 ${upcomingCount} 条`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error("迁移失败:", e);
  process.exit(1);
});
