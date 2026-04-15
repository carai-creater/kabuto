import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureDemoWalletMinBalance } from "@/lib/demo-wallet";
import { isDemoLoginEnabled } from "@/lib/demo";
import { SESSION_COOKIE } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // 二重ガード: NEXT_PUBLIC_* の事故設定でも本番では絶対に通さない。
  // isDemoLoginEnabled() は NEXT_PUBLIC_ENABLE_DEMO_LOGIN を見るため、
  // サーバー側でも NODE_ENV を独立に判定する。
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "not found" },
      { status: 404 }
    );
  }
  if (!isDemoLoginEnabled()) {
    return NextResponse.json(
      { ok: false, error: "demo login disabled" },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => null)) as { userId?: string } | null;
  const userId = body?.userId?.trim();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ ok: false, error: "unknown user" }, { status: 404 });
  }

  await ensureDemoWalletMinBalance(userId);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true });
}
