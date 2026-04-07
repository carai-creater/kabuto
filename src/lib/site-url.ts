/**
 * 本番（Vercel）で正しいオリジンを返す。
 * 優先: NEXT_PUBLIC_SITE_URL → VERCEL_URL → Request の Origin
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

  return new URL(request.url).origin;
}
