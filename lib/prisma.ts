import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** 判断连接串是否指向 Neon serverless（HTTP 适配器只适用于 Neon）。 */
export function isNeonUrl(url: string): boolean {
  return url.toLowerCase().includes("neon.tech");
}

/**
 * 按 URL 自动选择适配器创建 PrismaClient：
 * - Neon（含 neon.tech）→ PrismaNeonHttp（HTTP，arrayMode: true）
 * - 其他（本地 PostgreSQL）→ PrismaPg
 */
export function createPrismaClient(url?: string): PrismaClient {
  const databaseUrl = url ?? process.env.DATABASE_URL ?? "";
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 未设置");
  }
  const adapter = isNeonUrl(databaseUrl)
    ? new PrismaNeonHttp(databaseUrl, { arrayMode: true })
    : new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
