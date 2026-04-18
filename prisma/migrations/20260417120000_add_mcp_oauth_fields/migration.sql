-- AlterTable: UserMcpConnection
-- credential を nullable に変更し、OAuth フィールドを追加する

ALTER TABLE "UserMcpConnection"
  -- authType 列（既存行は "token" のまま）
  ADD COLUMN IF NOT EXISTS "authType"     TEXT NOT NULL DEFAULT 'token',
  -- credential を nullable に変更（OAuth 方式では null）
  ALTER COLUMN "credential" DROP NOT NULL,
  -- OAuth 専用フィールド
  ADD COLUMN IF NOT EXISTS "accessToken"  TEXT,
  ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
  ADD COLUMN IF NOT EXISTS "expiresAt"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "scopes"       TEXT,
  ADD COLUMN IF NOT EXISTS "accountEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "accountId"    TEXT;
