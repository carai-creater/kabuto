/** 環境変数に Postgres URL が設定されているか（空なら Prisma を呼ばない） */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
