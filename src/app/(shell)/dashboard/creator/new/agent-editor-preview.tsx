import { prisma } from "@/lib/prisma";
import { parseKabutoEditor } from "@/lib/agent/editor-config";
import { RunAgentPanel } from "@/components/run-agent-panel";

type Props = {
  userId: string;
  previewSlug: string | null;
};

export async function AgentEditorPreview({ userId, previewSlug }: Props) {
  if (!previewSlug?.trim()) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center dark:border-slate-600 dark:bg-slate-950/40">
        <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
          プレビュー
        </p>
        <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
          左のフォームを保存すると、ここでチャットを試せます（GPT
          エディタの右ペインと同じ位置づけです）。
        </p>
      </div>
    );
  }

  const agent = await prisma.agent.findFirst({
    where: { slug: previewSlug.trim(), creatorId: userId },
    include: {
      conversationStarters: true,
    },
  });

  if (!agent) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-[13px] text-amber-950 dark:text-amber-100">
        プレビュー用のエージェントが見つかりません。一覧から開き直してください。
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
