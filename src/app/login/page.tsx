import Link from "next/link";

import { LoginForm } from "@/app/login/login-form";
import { SignupForm } from "@/app/signup/signup-form";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";
import { isSupabaseConfigured } from "@/utils/supabase/configured";

export async function generateMetadata() {
  return { title: "ログイン・新規登録 — kabuto" };
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
          ログイン・新規登録
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[var(--muted)]">
          Supabase Auth を使用します。メール確認が有効な場合は、登録後に届くリンクから完了してください。
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
          <div className="surface-card mt-10 space-y-10 p-6 sm:p-8">
            <section id="login-section" className="scroll-mt-24">
              <h2 className="text-[18px] font-semibold text-foreground">
                ログイン
              </h2>
              <div className="mt-4">
                <LoginForm />
              </div>
            </section>
            <div className="border-t border-[var(--border)] pt-10" />
            <section id="signup-section" className="scroll-mt-24">
              <h2 className="text-[18px] font-semibold text-foreground">
                新規登録
              </h2>
              <p className="mt-1 text-[14px] text-[var(--muted)]">
                はじめての方はメールアドレスでアカウントを作成
              </p>
              <div className="mt-4">
                <SignupForm />
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
