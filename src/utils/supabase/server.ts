import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/utils/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabasePublicEnv();

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or publishable/anon key. See .env.example",
    );
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component では Cookie を書けないことがある。セッション更新は middleware に任せる
        }
      },
    },
  });
}
