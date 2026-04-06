import Link from "next/link";

import { SignupForm } from "@/app/signup/signup-form";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";
import { isSupabaseConfigured } from "@/utils/supabase/configured";

export async function generateMetadata() {
  return { title: "新規登録 — kabuto" };
}

export default function SignupPage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const supabaseOk = isSupabaseConfigured();

  return (
    <main className={`relative flex flex-1 flex-col pb-28 pt-12 ${PAGE_SHELL}`}>
      <div className="relative mx-auto w-full max-w-md">
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
          新規登録
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[var(--muted)]">
          メールアドレスでアカウントを作成します。
        </p>

        {!supabaseOk ? (
          <div className="surface-card mt-10 p-6 text-[15px] text-[var(--muted)]">
            <p>
              Supabase の環境変数が未設定です。`.env.example` を参照してください。
            </p>
            <p className="mt-4">
              <Link href="/" className="text-[var(--accent)] underline">
                トップへ
              </Link>
            </p>
          </div>
        ) : (
          <div className="surface-card mt-10 p-6 sm:p-8">
            <SignupForm />
          </div>
        )}
      </div>
    </main>
  );
}
