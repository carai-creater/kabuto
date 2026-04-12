import Link from "next/link";

import { LoginForm } from "@/app/login/login-form";
import { SignupForm } from "@/app/signup/signup-form";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { messageForLoginErrorCode } from "@/lib/login-error-messages";
import { sanitizeInternalPath } from "@/lib/sanitize-redirect";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";
import { isSupabaseConfigured } from "@/utils/supabase/configured";

export async function generateMetadata() {
  return { title: "ログイン・新規登録 — kabuto" };
}

type PageProps = {
  searchParams: Promise<{ next?: string; login_error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const sp = await searchParams;
  const nextRaw = sp.next;
  const redirectAfterLogin = sanitizeInternalPath(nextRaw, "/dashboard");
  const loginErrorBanner = messageForLoginErrorCode(sp.login_error);

  const supabaseOk = isSupabaseConfigured();

  return (
    <main className={`relative flex flex-1 flex-col pb-28 pt-12 ${PAGE_SHELL}`}>
      <div className="relative mx-auto w-full max-w-md">
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
          ログイン・新規登録
        </h1>
        <p className="mt-3 text-[17px] text-[var(--muted)]">
          メール確認が有効なら、届いたリンクから登録を完了してください。
        </p>

        {loginErrorBanner && (
          <div
            className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-[14px] leading-relaxed text-[var(--foreground)] ring-1 ring-[var(--border)]"
            role="alert"
          >
            <p className="font-medium text-[var(--destructive)]">
              マイページに進めませんでした
            </p>
            <p className="mt-2 text-[var(--muted)]">{loginErrorBanner}</p>
          </div>
        )}

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
              を設定
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
                <LoginForm redirectTo={redirectAfterLogin} />
              </div>
            </section>
            <div className="border-t border-[var(--border)] pt-10" />
            <section id="signup-section" className="scroll-mt-24">
              <h2 className="text-[18px] font-semibold text-foreground">
                新規登録
              </h2>
              <p className="mt-2 text-[14px]">
                <Link
                  href="/signup"
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  新規登録ページ
                </Link>
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
