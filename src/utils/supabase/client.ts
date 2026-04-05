import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/utils/supabase/env";

export function createClient() {
  const { url, key } = getSupabasePublicEnv();

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or publishable/anon key. See .env.example",
    );
  }

  return createBrowserClient(url, key);
}
