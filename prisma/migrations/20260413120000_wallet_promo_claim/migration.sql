-- CreateTable
CREATE TABLE "WalletPromoClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pointsPt" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletPromoClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletPromoClaim_userId_slug_key" ON "WalletPromoClaim"("userId", "slug");

-- CreateIndex
CREATE INDEX "WalletPromoClaim_userId_idx" ON "WalletPromoClaim"("userId");

-- AddForeignKey
ALTER TABLE "WalletPromoClaim" ADD CONSTRAINT "WalletPromoClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
