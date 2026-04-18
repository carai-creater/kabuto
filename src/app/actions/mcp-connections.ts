"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { encryptMcpCredential } from "@/lib/crypto/mcp-credential";

export type McpAuthType = "token" | "oauth";

export type McpConnectionRow = {
  serverKey: string;
  label: string;
  connectedAt: Date;
  authType: McpAuthType;
  accountEmail: string | null;
};

export async function getUserMcpConnections(): Promise<McpConnectionRow[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];
  const rows = await prisma.userMcpConnection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      serverKey: true,
      label: true,
      createdAt: true,
      authType: true,
      accountEmail: true,
    },
  });
  return rows.map((r) => ({
    serverKey: r.serverKey,
    label: r.label,
    connectedAt: r.createdAt,
    authType: (r.authType === "oauth" ? "oauth" : "token") as McpAuthType,
    accountEmail: r.accountEmail,
  }));
}

export async function saveMcpConnection(
  serverKey: string,
  label: string,
  credential: string
): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("unauthorized");
  if (!serverKey.trim() || !credential.trim()) throw new Error("serverKey and credential required");

  const encrypted = encryptMcpCredential(credential.trim());

  await prisma.userMcpConnection.upsert({
    where: { userId_serverKey: { userId, serverKey } },
    create: { userId, serverKey, label, credential: encrypted },
    update: { label, credential: encrypted, updatedAt: new Date() },
  });
}

export async function deleteMcpConnection(serverKey: string): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("unauthorized");
  await prisma.userMcpConnection.deleteMany({ where: { userId, serverKey } });
}
