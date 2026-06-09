# 踩坑记录 & 解决方案

> 开发过程中遇到的问题和解决方法

---

## 1. Neon PostgreSQL + Prisma 7 适配器配置

**现象：** Prisma 7 不再支持在 `schema.prisma` 的 `datasource db` 中写 `url`，连接字符串必须通过适配器传入。

**原因：** Prisma 7 大版本变更，连接方式从 schema 声明式变为代码式。

**解决：**
```typescript
// ❌ Prisma 6 及之前 —— schema.prisma 里写 url
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ✅ Prisma 7 —— 代码中创建适配器
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL ?? "", {
  arrayMode: true,  // ← 关键配置！
});
export const prisma = new PrismaClient({ adapter });
```

**教训：** Prisma 7 是 Breaking Change。数据库 URL 在 `prisma.config.ts` 中声明（供 CLI 用），运行时通过适配器传入。务必读 `node_modules/next/dist/docs/` 中的 Prisma 文档。

---

## 2. PostgreSQL 数组字段 `.forEach is not a function` 崩溃

**现象：** 统计页面调用 `g.platforms.forEach()` 时报错 `forEach is not a function`。

**原因：** PostgreSQL 的 `TEXT[]` 数组列，Neon HTTP 适配器默认以字符串格式返回（如 `{PC,Switch}`），而不是 JavaScript 数组。必须配置 `arrayMode: true` 才能自动解析。

**解决：**
1. **适配器加 `arrayMode: true`**（见上方代码）——从根源解决
2. **API 层加规范化中间件**——防护层
3. **客户端加 `asArray()` 防御函数**——兜底

如果已经存储了错误数据，重启 dev server 让新的 Prisma Client 生效。

**教训：** 
- 数据库变更适配器配置后，必须重启 dev server（Next.js 模块缓存不会自动刷新 Prisma Client 单例）
- PostgreSQL 数组 ≠ JavaScript 数组，中间需要解析
- 在 API 响应中做数据规范化，不要让前端替后端擦屁股

---

## 3. 种子脚本无法读取 `.env`

**现象：** `npx tsx prisma/seed.ts` 报错 `No database connection string`。

**原因：** `tsx` 运行脚本时不自动加载 `.env`，不像 Next.js dev server。

**解决：** 种子脚本顶部加：
```typescript
import "dotenv/config";  // 手动加载 .env
```

**教训：** 所有独立运行的脚本（seed、migration、工具脚本）都需要 `dotenv`，只有 Next.js 框架自身会内置加载 `.env`。

---

## 4. `.env.example` 被 `.gitignore` 排除

**现象：** `.env.example` 无法提交到 git。

**原因：** `.gitignore` 中 `.env*` 规则会匹配 `.env.example`。

**解决：** 在 `.env*` 后添加异常规则：
```gitignore
.env*
!.env.example    # 强制包含
```

**教训：** `.env*` 通配符会匹配所有 `.env` 开头的文件。如果需求 `example` 文件作为模板，必须加 `!` 排除。

---

## 5. Neon 连接字符串：Pooled vs Direct

**关键知识：**

| 用途 | 连接字符串 | 特征 |
|------|----------|------|
| 应用运行时 | Pooled connection | URL 含 `-pooler`，支持连接池 |
| `prisma db push` | Direct connection | URL 不含 `-pooler`，直接连接 |

- Pooled → 用于 `DATABASE_URL` 环境变量（应用 + 适配器）
- Direct → 用于 Prisma CLI 操作，或 `prisma.config.ts` 中的 datasource URL
- 如果在连接字符串中同时使用 `-pooler` URL 运行 `prisma db push`，可能会遇到连接问题

---

## 6. Vercel CLI 在中文 Windows 用户名下报错

**现象：** `npx vercel login` 报错 `is not a legal HTTP header value`。

**原因：** Vercel CLI 读取系统用户名生成 HTTP 请求头，Windows 中文用户名含非 ASCII 字符导致。

**解决：** 改用 Vercel 网页端 + GitHub 集成部署（`vercel.com` → Import Git Repository）。这其实比 CLI 更好——自动关联 GitHub，每次 `git push` 自动部署。

**教训：** CLI 工具不一定在所有环境下都能用，Web 端部署往往更可靠，还带自动部署的好处。

---

## 7. `PrismaClient` 单例 + 热重载导致的状态不一致

**现象：** API 返回的数据和数据库实际数据不一致（比如搜到 7 条但实际有 14 条，或者数组字段为空）。

**原因：** Next.js 开发模式下热重载频繁，但 `PrismaClient` 作为模块单例（`globalThis.prisma`）不会重新创建适配器。改了 `createPrismaClient` 函数后，如果 dev server 没重启，旧的适配器（没 `arrayMode: true`）一直在用。

**解决：** 修改 `lib/prisma.ts` 后**必须重启 dev server**。

**教训：** 模块单例在 hot-reload 环境下是"伪热更新"——真正的副作用代码（如适配器初始化）不会重新执行。

---

## 8. 项目多设备同步开发

**场景：** 两台电脑在同一个项目上开发。

**方案：**
```bash
# 新设备上：
git clone <repo-url>
npm install
cp .env.example .env          # 填入 Neon 连接字符串
npx prisma generate           # 生成类型安全的 Prisma Client
npm run dev
```

**要点：**
- Neon PostgreSQL 是云端数据库，所有设备连同一个实例——数据天然同步
- `.env` 不提交，每台设备自己维护（`.env.example` 是模板）
- `prisma generate` 必须在新设备上运行（`/app/generated/prisma` 也在 `.gitignore` 中）
- `node_modules` 不提交，靠 `npm install` 重建

---

## 项目核心文件架构速查

```
.env                           ← 密钥（不提交，每台设备自己维护）
.env.example                   ← 模板（提交，给新设备参考）
lib/prisma.ts                  ← Prisma 客户端（适配器配置的核心位置）
prisma/schema.prisma           ← 数据模型定义
prisma/seed.ts                 ← 初始数据
prisma.config.ts               ← Prisma 7 CLI 配置（数据源 URL）
app/api/                       ← 后端 API 路由
app/(其他目录)/                 ← 前端页面
lib/utils.ts                   ← 通用工具函数（含 normalizeGameArrays）
```
