# JuleSite 项目总结

> 最后更新：2026-08-05

## 一句话概括

个人游戏库管理网站 — 记录玩过的游戏、撰写评测笔记、统计游戏数据、维护待玩清单，附带管理后台 CRUD 和 Steam/IGDB 导入功能。

---

## 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 框架 | Next.js 16.2.7 (App Router) | React 19.2，混合服务端/客户端渲染 |
| 语言 | TypeScript 5 (strict) | 全栈类型安全 |
| 数据库 | Neon PostgreSQL（远程）/ 本机 PostgreSQL（本地） | 双库通过 npm script 一键切换 |
| ORM | Prisma 7.8 + 驱动适配器 | 远程 `@prisma/adapter-neon`（HTTP），本地 `@prisma/adapter-pg` |
| 认证 | iron-session 8 | Cookie-based 加密 session，7 天有效 |
| 样式 | Tailwind CSS 4 + @tailwindcss/postcss | 原子化 CSS，暗色模式 |
| 图表 | Chart.js + react-chartjs-2 | 统计页可视化 |
| 富文本 | react-markdown + remark-gfm | 游戏笔记 Markdown 渲染 |
| 部署 | Vercel | Git push 自动部署，免费层 100GB/月 |

---

## 数据模型

### Game（已拥有/已玩过的游戏）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String (cuid) | 主键 |
| `title` | String | 游戏标题 |
| `titleZh` | String? | 中文名 |
| `status` | String | backlog / playing / completed / dropped / wishlist |
| `rating` | Int? | 评分 1-10 |
| `difficulty` | Int? | 难度 1-10 |
| `playTimeHours` | Float? | 游玩时长 |
| `completionPct` | Int? | 通关进度 (%) |
| `playYear` | Int? | 游玩年份 |
| `playDate` | DateTime? | 具体日期 |
| `platforms` | String[] | PostgreSQL 原生 TEXT[] 数组 |
| `genres` | String[] | PostgreSQL 原生 TEXT[] 数组 |
| `developer` | String? | 开发商 |
| `publisher` | String? | 发行商 |
| `steamAppId` | String? | Steam App ID |
| `coverImageUrl` | String? | 封面图 URL |
| `screenshots` | Json | 截图列表 |
| `notes` | String? | Markdown 笔记 |
| `isRecommended` | Boolean | 是否推荐 |
| `createdAt` / `updatedAt` | DateTime | 时间戳 |

### UpcomingGame（期待的新游戏）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String (cuid) | 主键 |
| `title` | String | 游戏标题 |
| `titleZh` | String? | 中文名 |
| `releaseDate` | DateTime? | 预计发售日期 |
| `platforms` | String[] | PostgreSQL 原生 TEXT[] 数组 |
| `genres` | String[] | PostgreSQL 原生 TEXT[] 数组 |
| `price` | String? | 价格 |
| `summary` | String? | 简介 |
| `coverImageUrl` | String? | 封面图 URL |
| `screenshots` | Json | 截图列表 |
| `steamAppId` | String? | Steam App ID |
| `developer` | String? | 开发商 |
| `publisher` | String? | 发行商 |
| `isInterested` | Boolean | 是否感兴趣 |
| `createdAt` / `updatedAt` | DateTime | 时间戳 |

> 注意：UpcomingGame **没有** rating / difficulty / playTimeHours / playYear / notes / status 等 Game 专属字段。

---

## 路由架构

```
前台页面                           管理后台 (/admin/*)
├── /                 首页         ├── /admin           管理员登录
├── /games            游戏库       ├── /admin/games     游戏 CRUD
├── /games/[id]       游戏详情     ├── /admin/upcoming   期待游戏管理
├── /games/upcoming   期待游戏     └── /admin/import     Steam 导入
├── /stats            统计图表
├── /timeline         游玩时间线
└── /login            站点登录
```

**页面类型分布：**
- 服务端组件（直接查 Prisma）：`/timeline`、`/games/[id]`；`/` 首页为纯静态服务端组件（不查库）
- 客户端组件（fetch API）：`/games`、`/stats`、`/games/upcoming`、`/login`、所有 `/admin/*`

---

## 权限模型

```
┌─────────────────────────────────────────┐
│  未登录                                  │
│  只能访问 /login 和 /api/auth/*          │
├─────────────────────────────────────────┤
│  站点登录（SITE_USERNAME + SITE_PASSWORD）│
│  isAuthenticated = true                  │
│  可浏览所有页面，不能增删改                │
├─────────────────────────────────────────┤
│  管理登录（ADMIN_PASSWORD）               │
│  isAdmin = true                          │
│  可以增删改数据                           │
└─────────────────────────────────────────┘
```

两层认证独立，互不干扰。中间件 (`middleware.ts`) 在每次请求时检查 `isAuthenticated`，未通过则重定向到 `/login`。

---

## API 路由

| 端点 | 方法 | 说明 | 权限 |
|------|------|------|------|
| `/api/games` | GET | 游戏列表（支持筛选/排序/分页） | 站点登录 |
| `/api/games` | POST | 创建游戏 | 管理员 |
| `/api/games/[id]` | GET | 游戏详情 | 站点登录 |
| `/api/games/[id]` | PATCH | 更新游戏 | 管理员 |
| `/api/games/[id]` | DELETE | 删除游戏 | 管理员 |
| `/api/upcoming` | GET/POST | 期待游戏列表/创建 | GET 站点/POST 管理员 |
| `/api/upcoming/[id]` | GET/PATCH/DELETE | 期待游戏详情/更新/删除 | GET 站点/mutate 管理员 |
| `/api/auth/login` | POST | 站点登录（username + password） | 公开 |
| `/api/auth/admin-login` | POST | 管理员登录（password） | 公开 |
| `/api/auth/logout` | POST | 退出登录（scope: site/admin） | 公开 |
| `/api/auth/me` | GET | 当前 session 状态 | 公开 |
| `/api/steam/library` | GET | Steam 游戏库 | 管理员 |
| `/api/steam/import` | POST | 从 Steam 导入 | 管理员 |
| `/api/igdb/search` | GET | IGDB 搜索 | 管理员 |

---

## 核心文件

```
lib/
├── prisma.ts           # Prisma Client 工厂 + 单例（按 URL 自动选 Neon HTTP / 本地 pg 适配器）
├── auth.ts             # iron-session 认证（SessionData, getSession, isAdmin, isAuthenticated）
├── utils.ts            # parsePgArray(), normalizeGameArrays()
├── igdb.ts             # IGDB API 封装
└── steam.ts            # Steam API 封装

scripts/
├── switch-db.ts        # 切换远程/本地数据库（改写 .env 的 DATABASE_URL）
└── sync-db.ts          # 本地 ↔ 云端 双向全量同步

prisma/
├── schema.prisma       # 数据模型定义
├── seed.ts             # 种子数据
└── prisma.config.ts    # Prisma CLI 配置

middleware.ts           # 全站认证中间件（检查 isAuthenticated）

app/
├── layout.tsx          # 根布局（Navbar + Footer）
├── api/                # API 路由
├── login/              # 站点登录页
├── admin/              # 管理后台
├── games/              # 游戏浏览
├── stats/              # 统计
└── timeline/           # 时间线
```

---

## 数据库：远程 / 本地切换

### 概念

项目支持两套数据库，由 `.env` 里的 `DATABASE_URL` 决定当前连哪个库：

| 变量 | 含义 |
|------|------|
| `REMOTE_DATABASE_URL` | 远程 Neon（云端，Vercel 生产环境用这个） |
| `LOCAL_DATABASE_URL` | 本机 PostgreSQL（本地开发 / 离线使用） |
| `DATABASE_URL` | **当前生效**的连接串，由切换命令自动改写，**勿手改** |

`lib/prisma.ts` 会根据 URL 自动选择适配器：

- 含 `neon.tech` → `PrismaNeonHttp`（HTTP，`arrayMode: true`）
- 其他（`localhost` 等）→ `PrismaPg`（本机 TCP）

所以 `prisma db push`、`prisma studio`、`prisma/seed.ts` 等工具都自动跟随当前 `DATABASE_URL`，无需额外配置。

### 切换命令

```bash
npm run db:local     # 切到本机 PostgreSQL（自动改写 .env 的 DATABASE_URL）
npm run db:remote    # 切回远程 Neon
```

切换后注意：

- 若 dev server 正在运行需**重启**（`.env` 在进程启动时加载，不会热更新）。
- 若目标库还没建表，先执行 `npx prisma db push`。

### 首次使用本地库

1. 本机安装 PostgreSQL（建议 14+），并把 `psql` / `createdb` 加入 PATH（Windows 安装器默认在 `C:\Program Files\PostgreSQL\<版本>\bin`）。
2. 建库：`createdb -U postgres julesite`（或 `psql -U postgres -c "CREATE DATABASE julesite;"`）。
3. 在 `.env` 里填好两个连接串：

   ```
   REMOTE_DATABASE_URL="postgresql://user:xxx@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
   LOCAL_DATABASE_URL="postgresql://postgres:密码@localhost:5432/julesite"
   ```

4. 切到本地并建表：

   ```bash
   npm run db:local
   npx prisma db push
   ```

5. （可选）种入示例数据：`npx tsx prisma/seed.ts`（跟随当前库，重复运行会先清空再写入）。
6. 启动开发服务器：`npm run dev` → 打开 http://localhost:3000

### 启动开发服务器

```bash
npm run dev          # 本地开发（读 .env 里当前的 DATABASE_URL）
npm run build        # 生产构建
npm run start        # 运行生产构建产物（需先 build）
```

Windows 下也可以直接双击根目录的 `start-dev.bat`，等价于 `npm run dev`。

---

## 数据同步（本地 ↔ 云端）

`scripts/sync-db.ts` 把一端的**全部数据覆盖**到另一端（全量覆盖：目标表先清空，再从源表复制，复用记录 id）。与当前 `DATABASE_URL` 无关，只要两个 URL 配好即可使用。

```bash
npm run sync:to-local     # 远程 → 本地（用云端数据覆盖本地）
npm run sync:to-remote    # 本地 → 远程（用本地数据覆盖云端）
```

注意事项：

- **同步前目标库需已建表**（先对目标库跑一次 `npx prisma db push`）。
- 同步会**清空目标表的现有数据**再整表覆盖，是破坏性操作，执行前确认方向。
- 同步**到远程**（Neon HTTP 不支持事务）是非原子的：中途中断会留下半写状态，重跑一次即可（幂等）。
- 同步**到本地**走数据库事务，中途失败整体回滚（原子）。

---

## 关键设计决策

### Prisma 7 适配器模式
数据库 URL 不在 `schema.prisma` 中，而是通过代码传入。`lib/prisma.ts` 导出 `createPrismaClient(url?)` 工厂，按 URL 自动选择适配器（Neon → HTTP，本地 → pg），单例 `prisma` 跟随当前 `DATABASE_URL`；CLI 侧由 `prisma.config.ts` 从 `DATABASE_URL` 读取。

### PostgreSQL 原生数组
`platforms` 和 `genres` 用 `TEXT[]` 而非 JSON。必须配置 `arrayMode: true`，并用 `normalizeGameArrays()` 做防御性规范化。查询用 `where.platforms = { has: "PC" }`。

### 前端数据获取模式
- 服务端组件直接查 Prisma（仅 `/timeline` 和 `/games/[id]`）
- 客户端组件通过 API 路由获取数据
- 所有 Prisma 结果必须用 `normalizeGameArrays()` 规范化

### Session 管理
iron-session 加密 cookie，7 天 TTL。三层 session 字段：`isAuthenticated`（站点浏览）、`isAdmin`（管理操作）、`username`。

---

## 环境变量

```
DATABASE_URL=          # 当前生效的连接串（由 db:local/db:remote 改写，勿手改）
REMOTE_DATABASE_URL=   # 远程 Neon pooled 连接串
LOCAL_DATABASE_URL=    # 本机 PostgreSQL 连接串
SITE_USERNAME=         # 站点登录用户名
SITE_PASSWORD=         # 站点登录密码
ADMIN_PASSWORD=        # 管理员密码
SESSION_SECRET=        # Session 加密密钥
STEAM_API_KEY=         # Steam Web API（可选）
IGDB_CLIENT_ID=        # IGDB 客户端 ID（可选）
IGDB_CLIENT_SECRET=    # IGDB 密钥（可选）
```

---

## 常用命令

```bash
npm run dev             # 启动开发服务器
npm run build           # 生产构建
npm run lint            # ESLint
npm run db:local        # 切到本地 PostgreSQL
npm run db:remote       # 切到远程 Neon
npm run sync:to-local   # 远程 → 本地 全量同步
npm run sync:to-remote  # 本地 → 远程 全量同步
npx prisma db push      # 同步 schema 到当前 DATABASE_URL（本地或远程）
npx prisma generate     # 重新生成 Prisma Client
npx prisma studio       # 数据库管理 GUI
npx tsx prisma/seed.ts  # 运行种子数据（跟随当前库，幂等）
```

---

## 部署

Vercel + Neon PostgreSQL，完全免费：

- Git push → Vercel 自动构建部署
- 数据库云端，所有设备共享同一实例
- 环境变量在 Vercel Dashboard 配置
- 务必用 Neon Pooled connection（serverless 兼容）
