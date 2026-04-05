/** 公開してよい Supabase クライアント用（URL + anon / publishable） */
export function getSupabasePublicEnv(): { url: string | undefined; key: string | undefined } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  return { url, key };
}
