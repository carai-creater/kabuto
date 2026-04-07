/**
 * Supabase auth callback の `next` など、オープンリダイレクトを防ぐための相対パスのみ許可。
 */
export function sanitizeInternalPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || typeof next !== "string") return fallback;
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("\\")) return fallback;
  if (t.includes("://")) return fallback;
  return t;
}
