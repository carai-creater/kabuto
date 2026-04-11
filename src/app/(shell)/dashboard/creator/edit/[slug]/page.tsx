import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import {
  EditAgentForm,
  type EditAgentFormInitial,
} from "@/app/(shell)/dashboard/creator/edit/[slug]/edit-agent-form";
import { AgentEditorPreview } from "@/app/(shell)/dashboard/creator/new/agent-editor-preview";
import { parseKabutoEditor } from "@/lib/agent/editor-config";
import { coerceAgentModelId } from "@/lib/agent/model-options";
import { ensureProfileForUser } from "@/lib/auth/profile";
import { prisma } from "@/lib/prisma";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { getSessionUserId } from "@/lib/session";

function normalizeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

function buildEditInitial(
  agent: {
    slug: string;
    title: string;
    description: string;
    iconEmoji: string;
    systemPrompt: string;
    defaultLlm: string;
    pricePerUsePt: number;
    toolConfig: unknown;
    conversationStarters: { position: number; text: string }[];
  },
): EditAgentFormInitial {
  const editor = parseKabutoEditor(agent.toolConfig);
  const cap = editor?.capabilities;
  const act = editor?.actions;

  const byPos = new Map(
    agent.conversationStarters.map((s) => [s.position, s.text]),
  );
  const starters: [string, string, string, string] = [
    (byPos.get(0) ?? "") as string,
    (byPos.get(1) ?? "") as string,
    (byPos.get(2) ?? "") as string,
    (byPos.get(3) ?? "") as string,
  ];

  const authRaw = act?.authType;
  const actionsAuthType =
    authRaw === "api_key" || authRaw === "oauth" ? authRaw : "none";

  return {
    slug: agent.slug,
    title: agent.title,
    description: agent.description,
    iconEmoji: agent.iconEmoji,
    instructions: agent.systemPrompt,
    starters,
    defaultLlm: coerceAgentModelId(agent.defaultLlm),
    useRecommendedModel: editor?.useRecommendedModel !== false,
    capWebSearch: cap?.webSearch ?? false,
    capCanvas: cap?.canvas ?? false,
    capImageGen: cap?.imageGeneration ?? false,
    capCodeInterpreter: cap?.codeInterpreter ?? false,
    actionsAuthType,
    actionsOpenApiSchema: act?.openApiSchema ?? "",
    actionsPrivacyPolicyUrl: act?.privacyPolicyUrl ?? "",
    pricePerUsePt: agent.pricePerUsePt,
  };
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export async function generateMetadata(props: PageProps) {
  const { slug: raw } = await props.params;
  const slug = normalizeSlug(raw);
  return { title: `編集: ${slug} — kabuto` };
}

export default async function EditAgentPage(props: PageProps) {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login?next=%2Fdashboard%2Fcreator");
  }

  try {
    await ensureProfileForUser(userId);
  } catch {
    return <DbUnavailableMessage />;
  }

  const { slug: raw } = await props.params;
  const slug = normalizeSlug(raw);
  if (!slug) {
    notFound();
  }

  let agent;
  try {
    agent = await prisma.agent.findFirst({
      where: { slug, creatorId: userId },
      include: {
        conversationStarters: { orderBy: { position: "asc" } },
      },
    });
  } catch {
    return <DbUnavailableMessage />;
  }

  if (!agent) {
    notFound();
  }

  const initial = buildEditInitial(agent);
  const saved = (await props.searchParams).saved;

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
        エージェントを編集
      </h1>
      <p className="mt-2 max-w-3xl text-[15px] text-slate-600 dark:text-slate-400">
        {agent.isPublished ? (
          <span className="text-emerald-600 dark:text-emerald-400">公開中</span>
        ) : (
          <span className="text-slate-500">下書き</span>
        )}
        {" · "}
        左で編集 → 下書き保存または公開
      </p>

      {saved === "published" ? (
        <p
          className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100"
          role="status"
        >
          ストアに公開しました。トップの一覧に反映されます。
        </p>
      ) : null}
      {saved === "draft" ? (
        <p
          className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-200"
          role="status"
        >
          下書きを保存しました。
        </p>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-8">
          <EditAgentForm key={agent.id} initial={initial} />
        </div>

        <aside className="xl:sticky xl:top-6">
          <Suspense
            fallback={
              <div className="min-h-[420px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            }
          >
            <AgentEditorPreview userId={userId} previewSlug={slug} />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
