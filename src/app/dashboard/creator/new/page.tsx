import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NewAgentForm } from "@/app/dashboard/creator/new/new-agent-form";

export async function generateMetadata() {
  return { title: "エージェント新規作成 — kabuto" };
}

export default function NewAgentPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/dashboard/creator"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--accent)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        管理一覧に戻る
      </Link>
      <h1 className="mt-6 text-[28px] font-semibold tracking-tight text-foreground">
        新規エージェント
      </h1>
      <p className="mt-2 text-[15px] text-[var(--muted)]">
        名前・説明・指示・価格を設定します。保存後、エージェントページへ移動します。
      </p>

      <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg dark:shadow-black/40 sm:p-8">
        <NewAgentForm />
      </div>
    </div>
  );
}
