-- CreateTable
CREATE TABLE "AgentFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentFavorite_userId_agentId_key" ON "AgentFavorite"("userId", "agentId");

-- CreateIndex
CREATE INDEX "AgentFavorite_userId_idx" ON "AgentFavorite"("userId");

-- AddForeignKey
ALTER TABLE "AgentFavorite" ADD CONSTRAINT "AgentFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentFavorite" ADD CONSTRAINT "AgentFavorite_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
