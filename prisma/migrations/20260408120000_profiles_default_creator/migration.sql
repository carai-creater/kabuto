-- ログイン済みユーザーはエージェント作成・管理を既定で可能にする（admin は据え置き）
UPDATE "profiles" SET "role" = 'creator' WHERE "role" = 'user';

ALTER TABLE "profiles" ALTER COLUMN "role" SET DEFAULT 'creator'::"ProfileRole";
