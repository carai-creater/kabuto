"use client";

import { CheckCircle2, Circle, ListTodo, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Task = { id: string; label: string; done: boolean };

const PHASES = [
  { id: "hearing", label: "ヒアリング" },
  { id: "work", label: "実行" },
  { id: "review", label: "振り返り" },
] as const;

type Props = {
  agentId: string;
  agentTitle: string;
  starters: { id: string; position: number; text: string }[];
  linkedAgents: { id: string; slug: string; title: string }[];
};

function tasksFromStarters(starters: Props["starters"]): Task[] {
  return [...starters]
    .sort((a, b) => a.position - b.position)
    .slice(0, 6)
    .map((s) => ({
      id: `s-${s.id}`,
      label: s.text,
      done: false,
    }));
}

function buildDraftPrompt(input: {
  goal: string;
  output: string;
  constraints: string;
}): string {
  const goal = input.goal.trim() || "これからやることを一緒に整理したい";
  const output = input.output.trim() || "実行手順と優先順位";
  const constraints = input.constraints.trim() || "制約はまだ未定";

  return [
    "以下の条件で、進め方を一緒に決めてください。",
    `- 目的: ${goal}`,
    `- 欲しい成果物: ${output}`,
    `- 制約・条件: ${constraints}`,
    "",
    "まず最初の3ステップと、今すぐ私がやる1つを提案してください。",
  ].join("\n");
}

export function TaskWorkspacePanel({
  agentId,
  agentTitle,
  starters,
  linkedAgents,
}: Props) {
  const router = useRouter();
  const storageKey = `kabuto_taskboard_${agentId}`;
  const starterSignature = useMemo(
    () =>
      [...starters]
        .sort((a, b) => a.position - b.position)
        .map((s) => s.id)
        .join(","),
    [starters],
  );

  const [phase, setPhase] = useState<(typeof PHASES)[number]["id"]>("hearing");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [goal, setGoal] = useState("");
  const [output, setOutput] = useState("");
  const [constraints, setConstraints] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const seeded = tasksFromStarters(starters);
    const fallback: Task[] = [
      {
        id: "t-goal",
        label: "このセッションのゴールを一文で書く",
        done: false,
      },
    ];

    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          tasks?: Task[];
          phase?: string;
          starterSig?: string;
          goal?: string;
          output?: string;
          constraints?: string;
        };
        if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
          const sigMismatch =
            Boolean(parsed.starterSig) &&
            parsed.starterSig !== starterSignature &&
            seeded.length > 0;
          if (sigMismatch) {
            setTasks(seeded);
            setPhase("hearing");
          } else {
            setTasks(parsed.tasks);
            const p = parsed.phase;
            if (p === "hearing" || p === "work" || p === "review") {
              setPhase(p);
            }
          }
          setGoal(parsed.goal ?? "");
          setOutput(parsed.output ?? "");
          setConstraints(parsed.constraints ?? "");
          setHydrated(true);
          return;
        }
      }
    } catch {
      // fall through
    }

    setTasks(seeded.length > 0 ? seeded : fallback);
    setPhase("hearing");
    setHydrated(true);
  }, [agentId, storageKey, starters, starterSignature]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          tasks,
          phase,
          starterSig: starterSignature,
          goal,
          output,
          constraints,
        }),
      );
    } catch {
      // ignore
    }
  }, [
    constraints,
    goal,
    hydrated,
    output,
    phase,
    starterSignature,
    storageKey,
    tasks,
  ]);

  const toggle = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }, []);

  const addTask = useCallback(() => {
    const v = newLabel.trim();
    if (!v) return;
    setTasks((prev) => [...prev, { id: `c-${Date.now()}`, label: v, done: false }]);
    setNewLabel("");
  }, [newLabel]);

  const insertDraftToChat = useCallback(() => {
    const text = buildDraftPrompt({ goal, output, constraints });
    window.dispatchEvent(
      new CustomEvent("kabuto-chat-prefill", {
        detail: { agentId, text },
      }),
    );
  }, [agentId, constraints, goal, output]);

  const handoffToAgent = useCallback(
    (target: { slug: string; title: string }) => {
      const text = buildDraftPrompt({ goal, output, constraints });
      try {
        sessionStorage.setItem(
          "kabuto_agent_handoff_draft",
          JSON.stringify({
            toSlug: target.slug,
            fromTitle: agentTitle,
            text,
            ts: Date.now(),
          }),
        );
      } catch {
        // ignore storage errors
      }
      router.push(`/agents/${encodeURIComponent(target.slug)}`);
    },
    [agentTitle, constraints, goal, output, router],
  );

  const doneCount = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  if (!hydrated) {
    return (
      <div className="min-h-[12rem] border-b border-[var(--border)] bg-[var(--card)] px-4 py-6 lg:min-h-0 lg:border-b-0 lg:border-l">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-[var(--border)]" />
          <div className="h-10 w-full rounded-lg bg-[var(--border)]" />
          <div className="h-16 w-full rounded-lg bg-[var(--border)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-[min(55dvh,28rem)] flex-col border-b border-[var(--border)] bg-[var(--card)] lg:max-h-none lg:h-[min(100dvh,100vh)] lg:min-h-0 lg:border-b-0 lg:border-l">
      <div className="shrink-0 border-b border-[var(--border)]/80 px-4 py-3 lg:px-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          <ListTodo className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
          あなたのタスク
        </div>
        <p className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
          {agentTitle}
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--muted)]">
          会話しながら、AI に依頼する内容を具体化していきます。
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="作業フェーズ">
          {PHASES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={phase === p.id}
              onClick={() => setPhase(p.id)}
              className={
                phase === p.id
                  ? "rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
                  : "rounded-full border border-[var(--border)] bg-[var(--card-elevated)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] transition hover:border-[var(--accent)]/35 hover:text-foreground"
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>進捗（人のタスク）</span>
            <span className="tabular-nums font-medium text-foreground">
              {doneCount}/{total} · {pct}%
            </span>
          </div>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--border)]"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 lg:px-5">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)]/80 p-3">
          <p className="text-[12px] font-semibold text-foreground">依頼を一緒に決める</p>
          <div className="mt-2 space-y-2">
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="目的（例: LPの改善案を作る）"
              className="input-apple min-h-9 w-full text-[12px]"
            />
            <input
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="欲しい成果物（例: 3案 + 優先順位）"
              className="input-apple min-h-9 w-full text-[12px]"
            />
            <input
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="制約（例: 今日中・予算なし）"
              className="input-apple min-h-9 w-full text-[12px]"
            />
          </div>
          <button
            type="button"
            onClick={insertDraftToChat}
            className="btn-primary mt-2.5 w-full py-2 text-[12px]"
          >
            この内容をチャット入力に入れる
          </button>
        </section>

        {linkedAgents.length > 0 && (
          <section className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)]/80 p-3">
            <p className="text-[12px] font-semibold text-foreground">
              自分のエージェントへ引き継ぐ
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
              いま整理した依頼内容を、別エージェントに渡して続けられます。
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {linkedAgents.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handoffToAgent(a)}
                  className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] font-medium text-[var(--muted)] transition hover:border-[var(--accent)]/40 hover:text-foreground"
                >
                  {a.title} へ引き継ぐ
                </button>
              ))}
            </div>
          </section>
        )}

        <ul className="space-y-2.5" role="list">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)]/90 p-3 shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggle(task.id)}
                className="mt-0.5 shrink-0 text-[var(--accent)] transition hover:opacity-80"
                aria-pressed={task.done}
                aria-label={task.done ? "未完了に戻す" : "完了にする"}
              >
                {task.done ? (
                  <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                ) : (
                  <Circle className="h-5 w-5" strokeWidth={2} />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[13px] leading-snug ${
                    task.done
                      ? "text-[var(--muted)] line-through decoration-[var(--muted)]/80"
                      : "text-foreground"
                  }`}
                >
                  {task.label}
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                  <User className="h-3 w-3 opacity-80" aria-hidden />
                  担当: あなた
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 border-t border-[var(--border)] px-4 py-3 lg:px-5">
        <label
          htmlFor={`task-add-${agentId}`}
          className="text-[11px] font-medium text-[var(--muted)]"
        >
          タスクを追加
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id={`task-add-${agentId}`}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTask();
              }
            }}
            placeholder="やることを入力…"
            className="input-apple min-h-10 flex-1 text-[13px]"
          />
          <button
            type="button"
            onClick={addTask}
            className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center p-0"
            aria-label="タスクを追加"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
