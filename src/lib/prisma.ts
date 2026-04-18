import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

/**
 * サーバーレス環境での接続数を制限して DB 接続確立コストを抑える。
 * connection_limit=1 は Vercel Serverless の推奨値（PgBouncer 経由前提）。
 */
export const prisma =
  globalThis._prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis._prisma = prisma;
}
