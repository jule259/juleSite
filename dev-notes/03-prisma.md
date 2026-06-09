# Prisma 学习笔记

> PHP PDO/mysqli 用户的 ORM 入门

## 核心概念

```typescript
// Prisma Client ≈ PHP 的 PDO 但类型安全
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
```

## Schema 定义

```prisma
// prisma/schema.prisma —— 相当于 CREATE TABLE 的声明式写法
model Game {
  id        String   @id @default(cuid())
  title     String
  rating    Int?
  status    String   @default("backlog")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 常用操作

```bash
npx prisma db push      # 把 schema 同步到数据库（开发用）
npx prisma db seed      # 运行种子数据
npx prisma studio       # 打开数据库管理 UI（类似 phpMyAdmin）
npx prisma generate     # 重新生成 Prisma Client
```
