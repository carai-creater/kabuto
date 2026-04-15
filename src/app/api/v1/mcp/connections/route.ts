import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptMcpCredential } from "@/lib/crypto/mcp-credential";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

/**
 * `GET /api/v1/mcp/connections`  — list my connections (no credentials)
 * `POST /api/v1/mcp/connections` — upsert one
 *
 * Credentials are encrypted at rest via the existing
 * `encryptMcpCredential` helper. We never return the plaintext.
 */

export async function GET(req: NextRequest) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const rows = await prisma.userMcpConnection.findMany({
    where: { userId: resolved.userId },
    orderBy: { createdAt: "desc" },
    select: { serverKey: true, label: true, createdAt: true },
  });
  return NextResponse.json({
    ok: true,
    items: rows.map((r) => ({
      server_key: r.serverKey,
      label: r.label,
      connected_at: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const rec = (body ?? {}) as Record<string, unknown>;
  const serverKey = typeof rec.server_key === "string" ? rec.server_key.trim() : "";
  const label = typeof rec.label === "string" ? rec.label.trim() : "";
  const credential = typeof rec.credential === "string" ? rec.credential.trim() : "";
  if (!serverKey || !credential) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }
  if (serverKey.length > 100 || label.length > 200) {
    return NextResponse.json({ ok: false, error: "too_long" }, { status: 400 });
  }

  const encrypted = encryptMcpCredential(credential);
  await prisma.userMcpConnection.upsert({
    where: { userId_serverKey: { userId: resolved.userId, serverKey } },
    create: { userId: resolved.userId, serverKey, label, credential: encrypted },
    update: { label, credential: encrypted, updatedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
