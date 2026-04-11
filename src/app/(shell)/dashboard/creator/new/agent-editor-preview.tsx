import { parseKabutoEditor } from "@/lib/agent/editor-config";
import { prisma } from "@/lib/prisma";
import { RunAgentPanel } from "@/components/run-agent-panel";

type Props = {
  userId: string;
  previewSlug: string | null;
};

function PreviewDbError({ detail }: { detail?: string }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-left dark:bg-red-950/30">
      <p className="text-[14px] font-semibold text-red-950 dark:text-red-100">
        プレビューを読み込めませんでした
      </p>
      <p className="mt-2 text-[13px] text-red-900/90 dark:text-red-200/90">
        DB 接続を確認（{" "}
        <code className="rounded bg-red-500/15 px-1.5 py-0.5 text-[12px]">
          DATABASE_URL
        </code>{" "}
        /{" "}
        <code className="rounded bg-red-500/15 px-1.5 py-0.5 text-[12px]">
          DIRECT_URL
        </code>
        、{" "}
        <code className="rounded bg-red-500/15 px-1.5 py-0.5 text-[12px]">
          prisma migrate deploy
        </code>
        ）
      </p>
      {detail ? (
        <p className="mt-3 font-mono text-[11px] text-red-800/80 dark:text-red-300/70">
          {detail}
        </p>
      ) : null}
      <p className="mt-4 text-[12px] text-red-800/80 dark:text-red-300/80">
        保存済みなら{" "}
        <a
          href="/dashboard/creator"
          className="font-medium underline underline-offset-2"
        >
          一覧
        </a>
        から開いてください。
      </p>
    </div>
  );
}

export async function AgentEditorPreview({ userId, previewSlug }: Props) {
  if (!previewSlug?.trim()) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center dark:border-slate-600 dark:bg-slate-950/40">
        <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
          プレビュー
        </p>
        <p className="mt-3 max-w-sm text-[13px] text-slate-600 dark:text-slate-400">
          フォームを保存するとここで試行できます
        </p>
      </div>
    );
  }

  let agent;
  try {
    agent = await prisma.agent.findFirst({
      where: { slug: previewSlug.trim(), creatorId: userId },
      include: {
        conversationStarters: true,
      },
    });
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : "Unknown error";
    return <PreviewDbError detail={msg} />;
  }

  if (!agent) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-[13px] text-amber-950 dark:text-amber-100">
        プレビュー対象が見つかりません
      </div>
    );
  }

  const editor = parseKabutoEditor(agent.toolConfig);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          プレビュー
        </p>
        <a
          href={`/agents/${agent.slug}`}
          className="text-[12px] font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          公開ページへ →
        </a>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <RunAgentPanel
          agentId={agent.id}
          isLoggedIn
          defaultModelId={agent.defaultLlm}
          useCreatorRecommendedModel={editor?.useRecommendedModel !== false}
          pricePerUsePt={agent.pricePerUsePt}
          starters={agent.conversationStarters}
          tools={agent.tools}
          showToolDetails
          fullScreenChat
        />
      </div>
    </div>
  );
}
