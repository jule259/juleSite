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

## 9. 管理后台编辑时字段不显示数据库值

**现象：** 点击「编辑」按钮，封面 URL、开发商、发行商、备注等字段显示为空，但数据库里明明有值。

**原因：** `fillForm()` 函数中这些字段被硬编码为空字符串，没有从 `game` 对象读取：
```typescript
// ❌ 错误
developer: "",          // 永远是空
publisher: "",
coverImageUrl: "",
notes: "",
```

**解决：** 改为从 `game` 对象取值：
```typescript
// ✅ 正确
developer: game.developer ?? "",
publisher: game.publisher ?? "",
coverImageUrl: game.coverImageUrl ?? "",
notes: game.notes ?? "",
```

**教训：** 
- 改 interface 字段时务必检查所有使用该 interface 的函数
- TypeScript 只在 interface 有该字段时才报错——如果 interface 也漏了字段，编译器不会提醒
- 凡是看到硬编码的空字符串/默认值，想想是不是该从数据源读

---

## 10. iron-session 会话过期导致频繁重新登录

**现象：** 管理后台每次切换页面、或者去前台逛一圈回来，就要重新输密码。

**原因：** 
1. iron-session 默认 `ttl` 为 0（浏览器会话级 cookie，关标签页即失效）
2. 没有设置 `maxAge`，cookie 在浏览器端的持久化不可靠
3. 登录页不做已有 session 检查，每次访问都弹出密码框

**解决：**
```typescript
// lib/auth.ts
export const sessionOptions: SessionOptions = {
  ttl: 60 * 60 * 24 * 7,       // 服务端：7 天过期
  cookieOptions: {
    maxAge: 60 * 60 * 24 * 7,  // 浏览器端：7 天
  },
};

// app/admin/page.tsx —— 登录页自动跳过
useEffect(() => {
  fetch("/api/games?pageSize=1").then(res => {
    if (res.ok) router.replace("/admin/games");
    else setChecking(false);
  });
}, []);
```

**教训：** 每次配置 session/cookie 库时，第一时间设 `ttl` 和 `maxAge`，别依赖默认值。

---

## 11. "返回前台" 链接的语义设计

**需求：** 用户希望通过「← 返回前台」退出管理模式，下次访问后台需要重新输密码。

**实现：** 不能用 `<Link>` 纯跳转，因为 session 还在。需要：
```typescript
// 改为 button + fetch 登出
async function handleLeave() {
  await fetch("/api/auth/logout", { method: "POST" });  // 销毁 session
  router.push("/");  // 然后跳转首页
}
```

**设计要点：**
- 在管理页面之间随意切换 → session 保留，无需重新登录
- 点击「← 返回前台」→ 主动销毁 session → 等同于"退出管理模式"
- 直接关浏览器 / 手动访问首页 → session 保留，回后台免登录

---

## 12. Neon HTTP 适配器不支持批量写（deleteMany / createMany）

**现象：** `npm run sync:to-remote` 报错 `Transactions are not supported in HTTP mode`，同步中断；且第一次失败后远程库被清空（DELETE 成功但写入失败）。

**原因：** Prisma 7 在 Neon HTTP 适配器下，`deleteMany` / `createMany` 这类批量操作**会自动包事务**（即使没写 `$transaction`），而 Neon HTTP 模式不支持事务。单条操作（`findMany`、`create`、`delete`、`$executeRawUnsafe`）不需要事务，可正常使用。

**解决：** 同步脚本对远程目标改用 raw DELETE + 逐条 create：
```typescript
await db.$executeRawUnsafe(`DELETE FROM "Game"`);   // raw 单语句不包事务
for (const row of rows) {
  await db.game.create({ data: row });              // 单条 create 不包事务
}
```

**教训：**
- Neon HTTP 下 `deleteMany` / `createMany` 不可用；批量写要换成 raw SQL 或逐条单写
- 本地 pg 适配器无此限制，`$transaction` + `deleteMany`/`createMany` 正常
- 同步到远程非原子：`DELETE` 成功但写入中断会留下空库/半数据，重跑即可（幂等），但推送前确保本地有一份完整数据兜底

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
