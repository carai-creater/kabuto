import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { NewAgentForm } from "@/app/(shell)/dashboard/creator/new/new-agent-form";
import { AgentEditorPreview } from "@/app/(shell)/dashboard/creator/new/agent-editor-preview";
import { ensureProfileForUser } from "@/lib/auth/profile";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

export async function generateMetadata() {
  return { title: "エージェント新規作成 — kabuto" };
}

type PageProps = { searchParams: Promise<{ preview?: string }> };

export default async function NewAgentPage(props: PageProps) {
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

  const preview = (await props.searchParams).preview ?? null;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-0">
      <Link
        href="/dashboard/creator"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        管理一覧に戻る
      </Link>
      <h1 className="mt-6 text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
        エージェントを作成
      </h1>
      <p className="mt-2 max-w-3xl text-[15px] text-slate-600 dark:text-slate-400">
        ChatGPT の GPT エディタのように、左で構成を編集し、保存後は右でプレビューできます。
      </p>

      <div className="mt-10 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-8">
          <NewAgentForm />
        </div>

        <aside className="xl:sticky xl:top-6">
          <Suspense
            fallback={
              <div className="min-h-[420px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            }
          >
            <AgentEditorPreview userId={userId} previewSlug={preview} />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
