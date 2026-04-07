-- CreateEnum
CREATE TYPE "ProfileRole" AS ENUM ('user', 'creator', 'admin');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProfileRole" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestChatUsage" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "dayUtc" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestChatUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestChatUsage_ipHash_dayUtc_key" ON "GuestChatUsage"("ipHash", "dayUtc");

-- CreateIndex
CREATE INDEX "GuestChatUsage_ipHash_idx" ON "GuestChatUsage"("ipHash");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill Profile for existing users
INSERT INTO "Profile" ("id", "userId", "role", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, u."id", 'user'::"ProfileRole", NOW(), NOW()
FROM "User" u
WHERE NOT EXISTS (SELECT 1 FROM "Profile" p WHERE p."userId" = u."id");
