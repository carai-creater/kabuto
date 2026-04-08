import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { NewAgentForm } from "@/app/(shell)/dashboard/creator/new/new-agent-form";
import { ensureProfileForUser } from "@/lib/auth/profile";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

export async function generateMetadata() {
  return { title: "エージェント新規作成 — kabuto" };
}

export default async function NewAgentPage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/demo");
  }

  try {
    await ensureProfileForUser(userId);
  } catch {
    return <DbUnavailableMessage />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/dashboard/creator"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        管理一覧に戻る
      </Link>
      <h1 className="mt-6 text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
        新規エージェント
      </h1>
      <p className="mt-2 text-[15px] text-slate-600 dark:text-slate-400">
        名前・説明・システムプロンプト・利用価格を設定します。保存後、エージェントページへ移動します。
      </p>

      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-8">
        <NewAgentForm />
      </div>
    </div>
  );
}
