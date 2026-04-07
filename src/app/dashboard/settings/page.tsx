import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Shield } from "lucide-react";

import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

export async function generateMetadata() {
  return { title: "設定 — kabuto" };
}

export default async function DashboardSettingsPage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/demo");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
        設定
      </h1>
      <p className="mt-2 text-[15px] text-[var(--muted)]">
        アカウントと通知の設定（順次拡張予定）
      </p>

      <div className="mt-10 space-y-4">
        <div className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-lg dark:shadow-black/40">
          <Shield className="h-6 w-6 shrink-0 text-[var(--accent)]" aria-hidden />
          <div>
            <p className="font-semibold text-foreground">セキュリティ</p>
            <p className="mt-1 text-[14px] text-[var(--muted)]">
              パスワード変更は Supabase のメール認証フローに準じます。
            </p>
          </div>
        </div>
        <div className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-lg dark:shadow-black/40">
          <Bell className="h-6 w-6 shrink-0 text-[var(--accent)]" aria-hidden />
          <div>
            <p className="font-semibold text-foreground">通知</p>
            <p className="mt-1 text-[14px] text-[var(--muted)]">
              通知設定は今後追加予定です。
            </p>
          </div>
        </div>
      </div>

      <p className="mt-10 text-[14px] text-[var(--muted)]">
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
          ダッシュボードに戻る
        </Link>
      </p>
    </div>
  );
}
