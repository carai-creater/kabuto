import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

/**
 * `GET /api/v1/me`
 *
 * iOS クライアント向けの「自分」情報エンドポイント。
 * Bearer JWT（Supabase アクセストークン）を検証し、既存の
 * `ensurePrismaUserFromAuth` → Prisma クエリで必要最小限のフィールドを返す。
 *
 * 既存の Server Action や `/api/*` は一切変更しない。
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const resolved = await resolveUserIdFromBearer(auth);
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: resolved.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      profile: {
        select: {
          role: true,
          bio: true,
          websiteUrl: true,
          xUrl: true,
        },
      },
      wallet: { select: { balancePt: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatarUrl,
      role: user.profile?.role ?? "user",
      bio: user.profile?.bio ?? null,
      website_url: user.profile?.websiteUrl ?? null,
      x_url: user.profile?.xUrl ?? null,
      wallet_balance_pt: user.wallet?.balancePt ?? 0,
    },
  });
}
