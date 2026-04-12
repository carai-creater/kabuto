/** 公開してよい Supabase クライアント用（URL + anon / publishable） */
export function getSupabasePublicEnv(): { url: string | undefined; key: string | undefined } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const keyRaw =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  // Vercel の入力ミスで JWT 途中に空白が入ると認証が通らない
  const key = keyRaw?.trim().replace(/\s+/g, "");

  return { url, key };
}
