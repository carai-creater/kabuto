import { NextResponse, type NextRequest } from "next/server";
import { getMarketplaceAgents } from "@/lib/marketplace-agents";
import { serializeAgentListItem } from "@/lib/api/v1/agent-serializer";

/**
 * `GET /api/v1/agents?q=&tag=&sort=&limit=`
 *
 * 既存 `getMarketplaceAgents()` (60s cache) を呼び、クエリパラメータで
 * 絞り込みとソートを **in-memory** で行う薄いラッパー。既存ロジック・
 * キャッシュタグ（`marketplace-agents`）を破壊しない。
 *
 * 認証: **不要**（匿名閲覧可）。
 */
export async function GET(req: NextRequest) {
  const rows = await getMarketplaceAgents();

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const tag = url.searchParams.get("tag")?.trim() ?? "";
  const sort = url.searchParams.get("sort") ?? "usage";
  const limit = clampInt(url.searchParams.get("limit"), 1, 100, 50);

  let filtered = rows;
  if (q.length > 0) {
    filtered = filtered.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q),
    );
  }
  if (tag.length > 0) {
    filtered = filtered.filter((a) => (a.tags ?? []).includes(tag));
  }

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "new":
        return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
      case "rating":
        return Number(b.ratingAvg) - Number(a.ratingAvg);
      case "usage":
      default:
        return b.usageCount - a.usageCount;
    }
  }).slice(0, limit);

  return NextResponse.json({
    ok: true,
    items: sorted.map(serializeAgentListItem),
  });
}

function clampInt(
  raw: string | null,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
