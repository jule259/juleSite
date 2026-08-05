import "dotenv/config";
import { createPrismaClient, isNeonUrl } from "../lib/prisma";

// 用法: tsx scripts/sync-db.ts <to-local|to-remote>
//   to-local  → 远程(REMOTE_DATABASE_URL) → 本地(LOCAL_DATABASE_URL)，用云端数据覆盖本地
//   to-remote → 本地(LOCAL_DATABASE_URL) → 远程(REMOTE_DATABASE_URL)，用本地数据覆盖云端
// 与当前 DATABASE_URL 无关；同步前目标库需已建表（prisma db push）。
const DIRECTION = process.argv[2];

if (DIRECTION !== "to-local" && DIRECTION !== "to-remote") {
  console.error("用法: tsx scripts/sync-db.ts <to-local|to-remote>");
  process.exit(1);
}

const toLocal = DIRECTION === "to-local";
const sourceUrl = toLocal ? process.env.REMOTE_DATABASE_URL : process.env.LOCAL_DATABASE_URL;
const targetUrl = toLocal ? process.env.LOCAL_DATABASE_URL : process.env.REMOTE_DATABASE_URL;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDelegate = any;

async function overwrite(client: AnyDelegate, rows: unknown[], label: string) {
  await client.deleteMany();
  if (rows.length === 0) {
    console.log(`  ✅ ${label}: 0 条（已清空目标）`);
    return;
  }
  for (const batch of chunk(rows, 500)) {
    await client.createMany({ data: batch });
  }
  console.log(`  ✅ ${label}: ${rows.length} 条`);
}

async function main() {
  if (!sourceUrl || !targetUrl) {
    console.error("错误: 请在 .env 中配置 LOCAL_DATABASE_URL 和 REMOTE_DATABASE_URL");
    process.exit(1);
  }

  const directionLabel = toLocal ? "远程 → 本地" : "本地 → 远程";
  console.log(`🔄 开始同步（${directionLabel}）...`);

  const source = createPrismaClient(sourceUrl);
  const target = createPrismaClient(targetUrl);

  try {
    // 先全量读入内存快照，回写源记录 id（cuid 复用，引用稳定）
    const games = await source.game.findMany();
    const upcoming = await source.upcomingGame.findMany();
    console.log(`   源数据: Game ${games.length} 条, UpcomingGame ${upcoming.length} 条`);

    if (isNeonUrl(targetUrl)) {
      // Neon HTTP 不支持事务 → 顺序执行（非原子）。中断后重跑即可，全量覆盖幂等。
      console.log("   ⚠️ 目标为远程 Neon（HTTP 不支持事务），先删后插非原子；中断后重跑即可");
      await overwrite(target.game, games, "Game");
      await overwrite(target.upcomingGame, upcoming, "UpcomingGame");
    } else {
      // 本地目标支持事务 → 原子覆盖，中途失败整体回滚
      await target.$transaction(async (tx) => {
        await overwrite(tx.game, games, "Game");
        await overwrite(tx.upcomingGame, upcoming, "UpcomingGame");
      });
    }

    console.log(
      `\n🎉 同步完成：${games.length} 款游戏 + ${upcoming.length} 款待发售已写入目标库`,
    );
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

main().catch((e) => {
  console.error("同步失败:", e);
  process.exit(1);
});
