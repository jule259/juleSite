import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 开始添加种子数据...");

  const games = [
    {
      title: "The Witcher 3: Wild Hunt",
      titleZh: "巫师3：狂猎",
      platforms: JSON.stringify(["PC", "PS5"]),
      genres: JSON.stringify(["RPG", "Open World"]),
      status: "completed",
      rating: 10,
      difficulty: 7,
      playTimeHours: 120,
      completionPct: 95,
      playYear: 2015,
      developer: "CD Projekt Red",
      steamAppId: "292030",
      coverImageUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg",
      isRecommended: true,
      notes: "史上最佳 RPG 之一。剧情、世界观、支线任务都是顶级水准。DLC「血与酒」堪称典范。",
    },
    {
      title: "Elden Ring",
      titleZh: "艾尔登法环",
      platforms: JSON.stringify(["PC", "PS5"]),
      genres: JSON.stringify(["Action RPG", "Souls-like"]),
      status: "completed",
      rating: 10,
      difficulty: 9,
      playTimeHours: 150,
      completionPct: 100,
      playYear: 2022,
      developer: "FromSoftware",
      steamAppId: "1245620",
      coverImageUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg",
      isRecommended: true,
      notes: "第一次接触魂系游戏，被难度和探索感深深吸引。交界地的世界设计无与伦比。",
    },
    {
      title: "Hollow Knight",
      titleZh: "空洞骑士",
      platforms: JSON.stringify(["PC", "Switch"]),
      genres: JSON.stringify(["Metroidvania", "Action"]),
      status: "completed",
      rating: 9,
      difficulty: 8,
      playTimeHours: 50,
      completionPct: 85,
      playYear: 2019,
      developer: "Team Cherry",
      steamAppId: "367520",
      coverImageUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg",
      isRecommended: true,
      notes: "手绘美术风格精美绝伦，战斗手感出色。期待续作「丝之歌」。",
    },
    {
      title: "Stardew Valley",
      titleZh: "星露谷物语",
      platforms: JSON.stringify(["PC", "Switch"]),
      genres: JSON.stringify(["Simulation", "Farming"]),
      status: "playing",
      rating: 9,
      difficulty: 3,
      playTimeHours: 80,
      completionPct: 60,
      playYear: 2020,
      developer: "ConcernedApe",
      steamAppId: "413150",
      coverImageUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg",
      isRecommended: true,
      notes: "一人开发的奇迹。种田、钓鱼、挖矿、社交，总有做不完的事情。",
    },
    {
      title: "Cyberpunk 2077",
      titleZh: "赛博朋克2077",
      platforms: JSON.stringify(["PC"]),
      genres: JSON.stringify(["RPG", "Open World"]),
      status: "completed",
      rating: 8,
      difficulty: 5,
      playTimeHours: 90,
      completionPct: 90,
      playYear: 2023,
      developer: "CD Projekt Red",
      steamAppId: "1091500",
      coverImageUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg",
      isRecommended: true,
      notes: "2.0 版本后体验大幅改善。夜之城的氛围营造一流，「往日之影」DLC 谍战剧情精彩。",
    },
    {
      title: "Baldur's Gate 3",
      titleZh: "博德之门3",
      platforms: JSON.stringify(["PC"]),
      genres: JSON.stringify(["CRPG", "Turn-based"]),
      status: "backlog",
      rating: null,
      difficulty: null,
      playTimeHours: null,
      completionPct: null,
      playYear: 2024,
      developer: "Larian Studios",
      steamAppId: "1086940",
      coverImageUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg",
      isRecommended: false,
      notes: "买了还没开始玩，听说自由度极高，需要大块时间沉浸进去。",
    },
    {
      title: "Hades",
      titleZh: "哈迪斯",
      platforms: JSON.stringify(["PC", "Switch"]),
      genres: JSON.stringify(["Roguelike", "Action"]),
      status: "completed",
      rating: 9,
      difficulty: 7,
      playTimeHours: 45,
      completionPct: 80,
      playYear: 2021,
      developer: "Supergiant Games",
      steamAppId: "1145360",
      coverImageUrl: "https://shared.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg",
      isRecommended: true,
      notes: "把叙事完美融入了 Roguelike 玩法。每一次死亡都是推动剧情的契机，角色塑造出色。",
    },
  ];

  for (const game of games) {
    await prisma.game.create({ data: game });
    console.log(`  ✅ ${game.title}`);
  }

  console.log(`\n🎮 已添加 ${games.length} 款游戏到数据库！`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
