import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ serverKey: string }> },
) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { serverKey } = await context.params;
  await prisma.userMcpConnection.deleteMany({
    where: { userId: resolved.userId, serverKey },
  });
  return NextResponse.json({ ok: true });
}
