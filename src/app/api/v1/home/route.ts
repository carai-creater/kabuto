import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMarketplaceAgents } from "@/lib/marketplace-agents";
import { serializeAgentListItem } from "@/lib/api/v1/agent-serializer";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

/**
 * `GET /api/v1/home`
 *
 * iOS ホーム画面の 1-コール集約エンドポイント。
 * 匿名時は 3 つのセクション（recommended / hot / new）のみ、
 * ログイン時は加えて wallet / recent_sessions / favorites を返す。
 *
 * すべて既存の `getMarketplaceAgents` と既存 Prisma テーブルを呼ぶだけで、
 * ビジネスロジックは追加しない。
 */
export async function GET(req: NextRequest) {
  const rows = await getMarketplaceAgents();

  // "hot" = usageCount 降順 Top 6（getMarketplaceAgents が既にこの順）
  const hot = rows.slice(0, 6);

  // "new" = createdAt 降順 Top 6
  const newest = [...rows]
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, 6);

  // "recommended" = rating 降順 × review 重み（簡易）Top 6
  const recommended = [...rows]
    .filter((a) => Number(a.ratingAvg) > 0)
    .sort(
      (a, b) =>
        Number(b.ratingAvg) * Math.log(1 + b.reviewCount) -
        Number(a.ratingAvg) * Math.log(1 + a.reviewCount),
    )
    .slice(0, 6);

  const viewer = await resolveUserIdFromBearer(req.headers.get("authorization"));

  type RecentSession = {
    slug: string;
    title: string;
    icon_emoji: string;
    icon_url: string | null;
    last_at: string;
  };
  type FavoriteCard = {
    id: string;
    slug: string;
    title: string;
    icon_emoji: string;
    icon_url: string | null;
  };
  let authed: {
    wallet_balance_pt: number;
    recent_sessions: RecentSession[];
    favorites: FavoriteCard[];
  } | null = null;

  if (viewer) {
    const [wallet, recentRows, favRows] = await Promise.all([
      prisma.wallet.findUnique({
        where: { userId: viewer.userId },
        select: { balancePt: true },
      }),
      prisma.chatSession.findMany({
        where: { userId: viewer.userId },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          updatedAt: true,
          agent: { select: { slug: true, title: true, iconEmoji: true, iconUrl: true } },
        },
      }),
      prisma.agentFavorite.findMany({
        where: { userId: viewer.userId },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          agent: { select: { id: true, slug: true, title: true, iconEmoji: true, iconUrl: true } },
        },
      }),
    ]);

    // 同一 agent の重複を除去
    const seen = new Set<string>();
    const recent_sessions: RecentSession[] = [];
    for (const r of recentRows) {
      if (seen.has(r.agent.slug)) continue;
      seen.add(r.agent.slug);
      recent_sessions.push({
        slug: r.agent.slug,
        title: r.agent.title,
        icon_emoji: r.agent.iconEmoji,
        icon_url: r.agent.iconUrl ?? null,
        last_at: r.updatedAt.toISOString(),
      });
    }

    authed = {
      wallet_balance_pt: Number(wallet?.balancePt ?? 0),
      recent_sessions,
      favorites: favRows.map((f) => ({
        id: f.agent.id,
        slug: f.agent.slug,
        title: f.agent.title,
        icon_emoji: f.agent.iconEmoji,
        icon_url: f.agent.iconUrl ?? null,
      })),
    };
  }

  return NextResponse.json({
    ok: true,
    recommended: recommended.map(serializeAgentListItem),
    hot: hot.map(serializeAgentListItem),
    new_arrivals: newest.map(serializeAgentListItem),
    ...(authed ?? {}),
    is_authenticated: viewer != null,
  });
}
