-- ============================================================
-- juleSite 本地库查询用例
-- 运行方式:
--   npm run db:local               # 切到本地库（确保 DATABASE_URL=LOCAL_DATABASE_URL）
--   psql "postgresql://..." -f sql/local-queries.sql
--   或
--   "C:/Program Files/PostgreSQL/18/bin/psql.exe" -h localhost -p 5432 -U postgres -d julesite -f sql/local-queries.sql
--
-- 注意:
--   1) 混合大小写列名必须用双引号: "titleZh"、"isRecommended" 不能写成 titlezh / isrecommended
--   2) platforms / genres 是 TEXT[] 数组, 不是逗号分隔字符串
--   3) screenshots 是 jsonb
--   4) Windows 下 psql 命令行直接传中文参数会按系统代码页(如 SJIS)编码而乱码,
--      请用 -f 指向本文件（UTF-8），并在 shell 里 export PGCLIENTENCODING=UTF8
-- ============================================================

-- ---------- 0. 建表确认 + 各表行数 ----------
\echo '== 0. 表行数 =='
SELECT 'Game' AS table_name, count(*) FROM "Game"
UNION ALL
SELECT 'UpcomingGame', count(*) FROM "UpcomingGame";

-- ---------- 1. 全量浏览（推荐先看这一条，所有列都在） ----------
\echo '== 1. 全量数据 =='
SELECT
  "title",
  "titleZh",
  "status",
  "rating",
  "platforms",
  "genres",
  "playTimeHours",
  "playYear",
  "isRecommended"
FROM "Game"
ORDER BY "createdAt" DESC;

-- ---------- 2. 按状态过滤：已通关 ----------
\echo '== 2. 已通关 =='
SELECT "title", "rating", "playYear", "isRecommended"
FROM "Game"
WHERE "status" = 'completed'
ORDER BY "playYear" DESC NULLS LAST;

-- ---------- 3. 数组过滤：平台包含 PC ----------
\echo '== 3. platforms 包含 PC =='
SELECT "title", "platforms"
FROM "Game"
WHERE 'PC' = ANY("platforms");

-- ---------- 4. 数组同时包含多值（PC 且 RPG）----------
\echo '== 4. platforms 含 PC 且 genres 含 RPG =='
SELECT "title", "platforms", "genres"
FROM "Game"
WHERE "platforms" @> ARRAY['PC'] AND "genres" @> ARRAY['RPG'];

-- ---------- 5. 统计：按状态分组 ----------
\echo '== 5. 各状态数量 / 平均评分 / 平均时长 =='
SELECT
  "status",
  count(*)                          AS 数量,
  round(avg("rating"), 1)           AS 平均评分,
  round(avg("playTimeHours")::numeric, 1) AS 平均时长
FROM "Game"
GROUP BY "status"
ORDER BY 数量 DESC;

-- ---------- 6. 统计：top 评分 ----------
\echo '== 6. 评分最高的 5 个 =='
SELECT "title", "rating", "playYear"
FROM "Game"
WHERE "rating" IS NOT NULL
ORDER BY "rating" DESC
LIMIT 5;

-- ---------- 7. 时间过滤：某年玩过的 ----------
\echo '== 7. 2024 年玩的 =='
SELECT "title", "playYear"
FROM "Game"
WHERE "playYear" = 2024
ORDER BY "playYear";

-- ---------- 8. 模糊搜索标题 ----------
\echo '== 8. 标题模糊搜索（含 巫师 / witcher）=='
SELECT "title", "titleZh"
FROM "Game"
WHERE "title" ILIKE '%witcher%' OR "titleZh" LIKE '%巫师%';

-- ---------- 9. jsonb 访问 screenshots ----------
\echo '== 9. 截图数量与第一张截图 URL =='
SELECT "title",
       jsonb_array_length("screenshots")                          AS 截图数,
       "screenshots"->>0                                          AS 第一张
FROM "Game"
WHERE jsonb_array_length("screenshots") > 0;

-- ---------- 10. 推荐作品 ----------
\echo '== 10. 推荐列表 =='
SELECT "title", COALESCE("titleZh", '') AS titleZh, "rating"
FROM "Game"
WHERE "isRecommended"
ORDER BY "rating" DESC NULLS LAST;
