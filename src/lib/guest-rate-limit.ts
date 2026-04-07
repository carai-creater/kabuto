import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";

const GUEST_DAILY_LIMIT = 3;

function getSalt(): string {
  return process.env.GUEST_IP_HASH_SALT ?? "kabuto-guest-v1";
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return "unknown";
}

export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${getSalt()}:${ip}`)
    .digest("hex");
}

function utcDayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * ゲスト 1 日あたりのチャット送信枠を 1 消費する。
 * 上限超過なら ok: false。
 */
export async function tryConsumeGuestChatSlot(
  req: Request
): Promise<{ ok: true } | { ok: false; reason: "limit" }> {
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const dayUtc = utcDayString();

  try {
    return await prisma.$transaction(async (tx) => {
      const row = await tx.guestChatUsage.findUnique({
        where: { ipHash_dayUtc: { ipHash, dayUtc } },
      });
      if (row && row.count >= GUEST_DAILY_LIMIT) {
        return { ok: false as const, reason: "limit" as const };
      }

      await tx.guestChatUsage.upsert({
        where: { ipHash_dayUtc: { ipHash, dayUtc } },
        create: { ipHash, dayUtc, count: 1 },
        update: { count: { increment: 1 } },
      });

      return { ok: true as const };
    });
  } catch (e) {
    console.error("[guest-rate-limit]", e);
    return { ok: false, reason: "limit" };
  }
}
