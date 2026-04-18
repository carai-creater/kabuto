/**
 * GET  /api/push/notify  — Vercel Cron が毎朝9時に呼び出す
 * POST /api/push/notify  — 手動テスト用
 *
 * 通知登録済みユーザーに対して、最終利用エージェントをもとに
 * プロアクティブな提案を Web Push で送信する。
 *
 * CRON_SECRET で保護（Authorization: Bearer <secret>）
 */

import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:admin@kabuto.ai",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

const CRON_SECRET = process.env.CRON_SECRET;

// エージェントごとのプロアクティブ提案テンプレート
const SUGGESTION_TEMPLATES: Record<string, string[]> = {
  "stock-concierge": [
    "今日の市場動向をチェックしませんか？",
    "ポートフォリオの確認はお済みですか？",
    "相場の振り返りをしてみましょう。",
  ],
  "jp-research-assistant": [
    "気になる話題はありますか？リサーチをお手伝いします。",
    "新しいテーマのリサーチを始めましょう。",
    "前回の調査の続きはいかがですか？",
  ],
  default: [
    "AIエージェントが何かお手伝いできることはありますか？",
    "今日もkabutoをご利用ください。",
    "新しいタスクを試してみませんか？",
  ],
};

function pickSuggestion(slug: string): string {
  const templates = SUGGESTION_TEMPLATES[slug] ?? SUGGESTION_TEMPLATES.default;
  return templates[Math.floor(Math.random() * templates.length)];
}

async function handleNotify(req: Request) {
  // 認証チェック: 本番で CRON_SECRET 未設定なら fail-closed（実質無認証を防ぐ）
  if (process.env.NODE_ENV === "production" && !CRON_SECRET) {
    console.error("[push/notify] CRON_SECRET not configured in production");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "VAPID not configured" }, { status: 500 });
  }

  // 通知登録済みユーザー一覧を取得
  const subscriptions = await prisma.pushSubscription.findMany({
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
      userId: true,
    },
  });

  if (subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // ユーザーごとの最終利用エージェントを取得
  const userIds = [...new Set(subscriptions.map((s) => s.userId))];
  const recentSessions = await prisma.chatSession.findMany({
    where: { userId: { in: userIds } },
    orderBy: { updatedAt: "desc" },
    distinct: ["userId"],
    select: {
      userId: true,
      updatedAt: true,
      agent: { select: { slug: true, title: true, iconEmoji: true } },
    },
  });

  const sessionByUser = new Map(recentSessions.map((s) => [s.userId, s]));

  let sent = 0;
  const failed: string[] = [];

  for (const sub of subscriptions) {
    const session = sessionByUser.get(sub.userId);
    const agentSlug = session?.agent.slug ?? "default";
    const agentTitle = session?.agent.title ?? "kabuto";
    const agentEmoji = session?.agent.iconEmoji ?? "🤖";
    const body = pickSuggestion(agentSlug);

    const payload = JSON.stringify({
      title: `${agentEmoji} ${agentTitle} からのご提案`,
      body,
      url: session ? `/agents/${agentSlug}` : "/",
    });

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (err: unknown) {
      // 410 Gone = サブスクリプションが無効 → 削除
      if (
        err &&
        typeof err === "object" &&
        "statusCode" in err &&
        (err as { statusCode: number }).statusCode === 410
      ) {
        failed.push(sub.id);
      } else {
        console.error("[push/notify] send error:", err);
      }
    }
  }

  // 無効なサブスクリプションを一括削除
  if (failed.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: failed } } });
  }

  return NextResponse.json({ sent, expired: failed.length });
}

// Vercel Cron が GET で呼び出す
export function GET(req: Request) {
  return handleNotify(req);
}

// 手動テスト用
export function POST(req: Request) {
  return handleNotify(req);
}
