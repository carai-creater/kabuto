/**
 * 本番（Vercel）で正しいオリジンを返す。
 * 優先: NEXT_PUBLIC_SITE_URL → VERCEL_URL → Request の Origin (開発のみ)
 *
 * 本番環境(NODE_ENV === "production")で NEXT_PUBLIC_SITE_URL も VERCEL_URL も
 * 未設定の場合は throw する。Host ヘッダ偽装で Stripe の戻り先や
 * Auth リダイレクトのオリジンが書き換わることを防ぐため。
 */
export function getPublicOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Public origin is not configured. Set NEXT_PUBLIC_SITE_URL (or rely on VERCEL_URL) in production.",
    );
  }

  return new URL(request.url).origin;
}
