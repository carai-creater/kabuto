import Link from "next/link";

import { LoginForm } from "@/app/login/login-form";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";
import { isSupabaseConfigured } from "@/utils/supabase/configured";

export async function generateMetadata() {
  return { title: "ログイン — kabuto" };
}

export default function LoginPage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const supabaseOk = isSupabaseConfigured();

  return (
    <main className={`relative flex flex-1 flex-col pb-28 pt-12 ${PAGE_SHELL}`}>
      <div className="relative mx-auto w-full max-w-md">
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
          ログイン
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[var(--muted)]">
          Supabase Auth でサインインします。メール確認が有効な場合は、登録後に届くリンクから完了してください。
        </p>

        {!supabaseOk ? (
          <div className="surface-card mt-10 p-6 text-[15px] text-[var(--muted)]">
            <p>
              <code className="rounded-md bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              と{" "}
              <code className="rounded-md bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              （または publishable）を設定してください。
            </p>
            <p className="mt-4">
              <Link href="/" className="text-[var(--accent)] underline">
                トップへ
              </Link>
            </p>
          </div>
        ) : (
          <div className="surface-card mt-10 p-6 sm:p-8">
            <LoginForm />
          </div>
        )}
      </div>
    </main>
  );
}
