# Prisma 学习笔记

> PHP PDO/mysqli 用户的 ORM 入门。本项目使用 Prisma 7 + Neon PostgreSQL。

---

## 核心概念

```typescript
// Prisma Client ≈ PHP 的 PDO 但类型安全
import { PrismaClient } from '../app/generated/prisma/client';
const prisma = new PrismaClient({ adapter });

// 查询 ≡ SELECT
const games = await prisma.game.findMany({
  where: { status: 'completed' },
  orderBy: { rating: 'desc' },
  take: 10,  // LIMIT 10
  skip: 20,  // OFFSET 20
});

// 单条查询 ≡ SELECT ... WHERE id = ?
const game = await prisma.game.findUnique({
  where: { id: 'xxx' },
});

// 创建 ≡ INSERT
const newGame = await prisma.game.create({
  data: {
    title: 'The Witcher 3',
    status: 'completed',
    rating: 10,
  },
});

// 更新 ≡ UPDATE
const updated = await prisma.game.update({
  where: { id: 'xxx' },
  data: { rating: 9 },
});

// 删除 ≡ DELETE
await prisma.game.delete({ where: { id: 'xxx' } });

// 计数 ≡ COUNT
const total = await prisma.game.count({ where: { status: 'completed' } });
```

---

## Prisma 7 重大变更：适配器模式

**Prisma 7 不再在 `schema.prisma` 中配置数据库 URL！**

```
旧方式 (Prisma ≤6)          新方式 (Prisma 7)
─────────────────────       ─────────────────────
schema.prisma                prisma.config.ts
  url = env("DB_URL")          datasource URL
  
                            lib/prisma.ts
                              适配器接收连接字符串
```

**本项目配置（Neon PostgreSQL HTTP）：**

```typescript
// lib/prisma.ts
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL ?? "", {
  arrayMode: true,  // ⚠️ PostgreSQL TEXT[] 必须开！
});
export const prisma = new PrismaClient({ adapter });
```

```typescript
// prisma.config.ts
import { defineConfig } from "prisma/config";
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,  // 供 CLI (db push 等) 使用
  },
});
```

---

## Schema 定义

```prisma
// prisma/schema.prisma —— 相当于 CREATE TABLE 的声明式写法
datasource db {
  provider = "postgresql"  // Prisma 7: 不写 url，通过适配器传入
}

model Game {
  id              String    @id @default(cuid())
  title           String
  rating          Int?
  difficulty      Int?
  playTimeHours   Float?    // PostgreSQL double precision
  platforms       String[]  @default([])  // PostgreSQL TEXT[] 数组
  genres          String[]  @default([])
  screenshots     Json      @default("[]")
  status          String    @default("backlog")
  notes           String?                  // TEXT，支持 Markdown
  isRecommended   Boolean   @default(false)
  playYear        Int?
  playDate        DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### 字段类型对照

| Prisma | PostgreSQL | 说明 |
|--------|-----------|------|
| `String` | `TEXT` | 普通文本 |
| `Int` | `INTEGER` | 整数 |
| `Float` | `DOUBLE PRECISION` | 浮点数 |
| `Boolean` | `BOOLEAN` | 布尔 |
| `DateTime` | `TIMESTAMP` | 日期时间 |
| `Json` | `JSONB` | JSON 数据 |
| `String[]` | `TEXT[]` | ⚠️ PostgreSQL 原生数组，不是 JSON |

### PostgreSQL 数组陷阱

`String[]` 列在 PostgreSQL 中存的是原生数组 `{val1,val2}`，不是 JSON `["val1","val2"]`。

- **必须**给 Neon HTTP 适配器加 `arrayMode: true`，否则查询返回字符串字面量
- 筛选用 `where.platforms = { has: "PC" }`（对应 SQL: `'PC' = ANY(platforms)`）
- API 返回前用 `normalizeGameArrays()` 规范化，防止客户端拿到字符串

---

## 单例模式（避免连接泄漏）

```typescript
// 开发环境热重载时，复用已存在的 Prisma Client 实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**为什么：** Next.js 开发模式下每个请求都重新编译模块，不加单例会导致每次都新建连接。

---

## 常用 CLI 命令

```bash
npx prisma db push         # 把 schema 同步到数据库（开发用，不需要 migration 文件）
npx prisma db seed         # 运行 prisma/seed.ts 种子数据
npx prisma generate        # 重新生成 Prisma Client（改了 schema 后必须运行）
npx prisma studio          # 打开数据库管理 UI（类似 phpMyAdmin，但需额外安装）
npx prisma format          # 格式化 schema.prisma
```

> ⚠️ `prisma db push` 用 `prisma.config.ts` 中的数据源 URL（即 `DATABASE_URL` 环境变量）

---

## 关联查询（虽然本项目未使用）

```typescript
// 一对多：Game 有多个 Tag
const gameWithTags = await prisma.game.findUnique({
  where: { id: 'xxx' },
  include: { tags: true },  // 相当于 LEFT JOIN
});
```
