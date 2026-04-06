import { getSupabasePublicEnv } from "@/utils/supabase/env";

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabasePublicEnv();
  return Boolean(url && key);
}
